from typing import Dict, Any, List, Optional
from config.database import get_db
from fastapi import HTTPException
import numpy as np
from scipy.spatial.distance import cosine
from sentence_transformers import SentenceTransformer
import logging
import math

try:
    embed_model = SentenceTransformer('all-mpnet-base-v2')
except Exception as e:
    logging.warning(f"Could not load SentenceTransformer: {e}")
    embed_model = None

async def get_leaderboard_aggregated(limit: int = 10) -> List[Dict[str, Any]]:
    db = get_db()

    res = db.table("certificates").select(
        "student_id, after_normalized, Users(nama, nim)"
    ).in_("status", ["validated", "processed"]).execute()

    if not res.data:
        return []

    data = {}

    for r in res.data:
        user_data = r.get("Users")
        if not user_data:
            continue
            
        if isinstance(user_data, list):
            if not user_data: continue
            user_info = user_data[0]
        else:
            user_info = user_data
            
        nama = user_info.get("nama", "Unknown")
        nim = user_info.get("nim", "Unknown")
        student_id = r.get("student_id")
        
        key = student_id if student_id else nama
        
        if key not in data:
            data[key] = {
                "student_id": student_id,
                "nama_mahasiswa": nama,
                "nim": nim,
                "total_spu": 0.0,
                "certificate_count": 0
            }

        try:
            after_norm = r.get("after_normalized") or {}
            spu = float(after_norm.get("spu_score", 0.0))
        except (ValueError, TypeError):
            spu = 0.0
            
        data[key]["total_spu"] += spu
        data[key]["certificate_count"] += 1

    leaderboard = list(data.values())

    for entry in leaderboard:
        total_spu = entry["total_spu"]
        count = entry["certificate_count"]
        
        weighted_score = total_spu * (1 + 0.1 * math.log(1 + count))
        
        entry["weighted_score"] = round(weighted_score, 2)
        entry["total_spu"] = round(total_spu, 2)
        entry["avg_spu"] = round(total_spu / count, 2) if count else 0.0

    # Sort by weighted_score descending
    leaderboard.sort(key=lambda x: x["weighted_score"], reverse=True)

    return leaderboard[:limit]


def make_embedding(text: str) -> Optional[List[float]]:
    if embed_model is None:
        return None
    try:
        vec = embed_model.encode(text)
        return vec.tolist()
    except Exception as e:
        logging.error(f"Error generating embedding: {e}")
        return None


async def search_certificates_similarity(
    query: str, 
    limit: int = 10,
    weights: Dict[str, float] = {'similarity': 0.9, 'spu': 0.1},
) -> List[Dict[str, Any]]:

    if not query:
        return []

    db = get_db()
    
    query_vec = make_embedding(query)
    query_vec_np = np.array(query_vec).flatten() if query_vec else None

    # Fetch all candidates (validated/processed)
    select_str = """
        id,
        student_id,
        embedding,
        after_normalized,
        parsed,
        evidence_url,
        status,
        Users (
            nama,
            nim
        )
    """
    
    try:
        res = db.table("certificates").select(select_str).in_("status", ["validated", "processed"]).execute()
    except Exception as e:
        logging.error(f"Database query error: {e}")
        return []

    records = res.data
    if not records:
        return []

    raw_matches = []
    
    use_semantic = query_vec_np is not None

    for r in records:
        try:
            # Check embedding existence
            emb = r.get("embedding")
            
            sim = 0.0
                        
            has_embedding = False
            if use_semantic and emb:
                # Parse embedding
                if isinstance(emb, str):
                    import json
                    try:
                        emb = json.loads(emb)
                    except:
                        emb = None
                
                if emb:
                    emb_vec = np.array(emb).flatten()
                    if emb_vec.shape[0] == query_vec_np.shape[0]:
                        sim = 1 - cosine(query_vec_np, emb_vec)
                        has_embedding = True
            
            # check for text match boost
            parsed = r.get("parsed") or {}
            event_name = parsed.get("event_name", "") or ""
            category = parsed.get("category_raw", "") or ""
            domain = parsed.get("domain_raw", "") or ""
            
            text_match = False
            if query.lower() in event_name.lower():
                text_match = True
            elif query.lower() in str(category).lower():
                text_match = True
            elif query.lower() in str(domain).lower():
                text_match = True
                
            # If no embedding and no text match, skip
            if not has_embedding and not text_match:
                continue
                
            # If text match but no embedding, give a base similarity score
            if not has_embedding and text_match:
                sim = 0.5 # Base score for text match
            
            # Extract SPU score from after_normalized
            after_norm = r.get("after_normalized") or {}
            spu_score = float(after_norm.get("spu_score", 0.0))
            
            final_score = (
                weights['similarity'] * sim +
                weights['spu'] * spu_score
            )
            
            # Extract event info
            event_info = {
                "event_name": event_name if event_name else "Unknown",
                "level_raw": parsed.get("level_raw", "Unknown"),
                "domain_raw": domain if domain else "Unknown",
                "category_raw": category if category else "Unknown"
            }

            # Extract user info
            student_name = "Unknown"
            student_nim = "Unknown"
            user_data = r.get("Users")
            if isinstance(user_data, list) and user_data:
                student_name = user_data[0].get("nama", "Unknown")
                student_nim = user_data[0].get("nim", "Unknown")
            elif isinstance(user_data, dict):
                student_name = user_data.get("nama", "Unknown")
                student_nim = user_data.get("nim", "Unknown")

            valid_entry = {
                "id": r.get("id"), 
                "student_id": r.get("student_id"),
                "student_name": student_name,
                "student_nim": student_nim,
                "event_name": event_info.get("event_name", "Unknown"),
                "level": event_info.get("level_raw", "Unknown"),
                "domain": event_info.get("domain_raw", "Unknown"),
                "category": event_info.get("category_raw", "Unknown"),
                "evidence_url": r.get("evidence_url"),
                "relevance_score": round(sim, 4),
                "spu_score": round(spu_score, 4),
                "final_score": round(final_score, 4)
            }
            raw_matches.append(valid_entry)

        except Exception as e:
            logging.warning(f"Error processing row in similarity search: {e}")
            continue

    # Group by student
    grouped = {}
    for m in raw_matches:
        sid = m["student_id"]
        if sid not in grouped:
            grouped[sid] = {
                "student_id": sid,
                "student_name": m["student_name"],
                "student_nim": m["student_nim"],
                "best_score": 0.0,
                "weighted_sum": 0.0,
                "matches": []
            }
        
        grouped[sid]["matches"].append(m)
        
        # Calculate contribution: similarity * spu_score
        contribution = m["relevance_score"] * m["spu_score"]
        grouped[sid]["weighted_sum"] += contribution

    # Calculate final best_score using the formula
    for sid, data in grouped.items():
        count = len(data["matches"])
        if count > 0:
            # Formula: total_weighted_spu * (1 + 0.1 * ln(1 + count))
            log_boost = 1 + 0.1 * math.log(1 + count)
            data["best_score"] = round(data["weighted_sum"] * log_boost, 2)

    # Convert to list and sort by best_score desc
    results = list(grouped.values())
    results.sort(key=lambda x: x["best_score"], reverse=True)
    
    # Sort matches within each student
    for res in results:
        res["matches"].sort(key=lambda x: x["final_score"], reverse=True)

    return results[:limit]