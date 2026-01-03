from typing import Dict, Any, List
from config.database import get_db
from fastapi import HTTPException
from datetime import datetime
from collections import Counter

async def get_user_profile_data(user_id: str) -> Dict[str, Any]:
    """Get user profile data from Users table"""
    db = get_db()
    
    result = db.table("Users").select("nama, nim, prodi, fakultas, angkatan").eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = result.data[0]
    return {
        "nama": user_data.get("nama", ""),
        "nim": user_data.get("nim", ""),
        "prodi": user_data.get("prodi", ""),
        "fakultas": user_data.get("fakultas", ""),
        "angkatan": user_data.get("angkatan", "")
    }


async def get_top_certificates(user_id: str, limit: int = 3) -> List[Dict[str, Any]]:
    """Get top certificates by SPU score"""
    db = get_db()
    
    # Get all certificates for user with after_normalized data
    result = db.table("certificates").select("parsed, created_at, after_normalized").eq("student_id", user_id).execute()
    
    certificates = []
    for cert in result.data:
        parsed = cert.get("parsed", {})
        after_normalized = cert.get("after_normalized", {})
        created = datetime.fromisoformat(cert.get("created_at")) if cert.get("created_at") else None
        
        # Extract certificate data
        cert_data = {
            "event_name": parsed.get("event_name", ""),
            "category_raw": parsed.get("category_raw", ""),
            "level_raw": parsed.get("level_raw", ""),
            "rank_raw": parsed.get("rank_raw", ""),
            "date_issued": created.strftime("%d-%m-%Y") if created else None,
            "domain_raw": parsed.get("domain_raw", ""),
            "spu_score": after_normalized.get("spu_score", 0.0)
        }
        certificates.append(cert_data)
    
    # Sort by SPU score and return top 3
    certificates.sort(key=lambda x: x["spu_score"], reverse=True)
    return certificates[:limit]


async def get_certificate_statistics(user_id: str) -> Dict[str, Any]:
    """Get certificate statistics including counts and unique domains"""
    db = get_db()
    
    # Get all certificates for user
    result = db.table("certificates").select("parsed, before_normalized, after_normalized").eq("student_id", user_id).execute()
    
    akademik_count = 0
    non_akademik_count = 0
    domain_counter = Counter()
    avg_spu = 0.0

    
    for cert in result.data:
        parsed = cert.get("parsed", {})
        before_normalized = cert.get("before_normalized", {})
        after_normalized = cert.get("after_normalized", {})
        
        # Count academic vs non-academic
        category_raw = before_normalized.get("category_raw", "")
        if category_raw.lower() == "akademik":
            akademik_count += 1
        elif category_raw.lower() == "non-akademik":
            non_akademik_count += 1
        
        # Count Domains
        domain_raw = parsed.get("domain_raw")
        if domain_raw:
            domain_counter[domain_raw] += 1

        # Count SPU Score
        spu_score = after_normalized.get("spu_score", 0.0) * 100
        avg_spu += spu_score
    
    return {
        "akademik_count": akademik_count,
        "non_akademik_count": non_akademik_count,
        "domain_counts": dict(domain_counter),
        "total_certificates": len(result.data),
        "avg_spu": avg_spu / len(result.data) if result.data else 0.0
    }


async def get_user_history(user_id: str) -> List[Dict[str, Any]]:
    """Get user certificate history"""
    db = get_db()
    
    # Get certificates with status and after_normalized data
    result = db.table("certificates").select("parsed, created_at, status, after_normalized").eq("student_id", user_id).execute()
    
    events = []
    for cert in result.data:
        parsed = cert.get("parsed", {})
        after_normalized = cert.get("after_normalized", {})
        created = datetime.fromisoformat(cert.get("created_at")) if cert.get("created_at") else None
        
        event_data = {
            "event_name": parsed.get("event_name", "") if isinstance(parsed, dict) else "",
            "category": parsed.get("category_raw", "") if isinstance(parsed, dict) else "",
            "tingkat": parsed.get("level_raw", "") if isinstance(parsed, dict) else "",
            "date_issued": created.strftime("%d-%m-%Y") if created else None,
            "skor_ai": round(after_normalized.get("spu_score", 0.0) * 100) if isinstance(after_normalized, dict) else 0.0,
            "status": cert.get("status", ""),
        }
        events.append(event_data)
    
    return events