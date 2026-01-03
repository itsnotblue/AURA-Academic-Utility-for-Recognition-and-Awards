from typing import Dict, Any, List
from unittest import result
from config.database import get_db
from fastapi import HTTPException
from datetime import datetime
import math

async def get_staff_profile_data(staff_id: str) -> Dict[str, Any]:
    db = get_db()
    
    result = db.table("Staff").select("nama, nip, jabatan, kode_staff").eq("id", staff_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    staff_data = result.data[0]
    return {
        "nama": staff_data.get("nama", ""),
        "nip": staff_data.get("nip", ""),
        "jabatan": staff_data.get("jabatan", ""),
        "kode_staff": staff_data.get("kode_staff", "")
    }


async def get_certificate_status_counts() -> Dict[str, int]:
    db = get_db()
    
    validated_count = 0
    processed_count = 0
    kampus_count = 0
    nasional_count = 0
    internasional_count = 0

    result = db.table("certificates").select("status", "parsed").execute()
    for r in result.data:
        status = (r.get("status") or "").lower()

        if status == "validated":
            validated_count += 1
        elif status == "processed":
            processed_count += 1

        parsed = r.get("parsed") or {}
        level = (parsed.get("level_raw") or "").lower()

        if level == "kampus":
            kampus_count += 1
        elif level == "nasional":
            nasional_count += 1
        elif level == "internasional":
            internasional_count += 1
    
    return {
        "validated_count": validated_count,
        "processed_count": processed_count,
        "kampus_count" : kampus_count,
        "nasional_count" : nasional_count,
        "internasional_count" : internasional_count,
    }


async def get_unique_students_by_fakultas() -> Dict[str, int]:
    db = get_db()
    
    # Get unique student_ids from certificates
    cert_result = db.table("certificates").select("student_id").execute()
    unique_student_ids = list(set(cert["student_id"] for cert in cert_result.data if cert.get("student_id")))
    
    # Get fakultas for each student
    count_students_by_fakultas = {}

    for student_id in unique_student_ids:
        user_result = db.table("Users").select("fakultas").eq("id", student_id).execute()
        if user_result.data:
            fakultas = user_result.data[0].get("fakultas", "Unknown")

            if fakultas not in count_students_by_fakultas:
                count_students_by_fakultas[fakultas] = 0
            count_students_by_fakultas[fakultas] += 1
            
    
    return {
        "unique_students_count": len(unique_student_ids),
        "count_students_by_fakultas": count_students_by_fakultas,
    }


async def get_recent_certificates() -> List[Dict[str, Any]]:
    db = get_db()
    
    # Get recent certificates with student and parsed data
    result = db.table("certificates").select("student_id, parsed, after_normalized, status, created_at, Users(fakultas)").order("created_at", desc=True).execute()
    
    certificates = []
    for cert in result.data:
        parsed = cert.get("parsed", {})
        after_normalized = cert.get("after_normalized", {})
        
        # Get student name
        if cert.get("student_id"):
            user_result = db.table("Users").select("nama").eq("id", cert["student_id"]).execute()
            student_name = user_result.data[0].get("nama", "Unknown") if user_result.data else "Unknown"
        else:
            student_name = "Unknown"

        created = datetime.fromisoformat(cert.get("created_at")) if cert.get("created_at") else None
        fakultas = cert.get("Users", {}).get("fakultas", "")
        
        cert_data = {
            "student_name": student_name,
            "event_name": parsed.get("event_name", ""),
            "status": cert.get("status", ""),
            "spu_score": after_normalized.get("spu_score", 0.0),
            "fakultas": fakultas,
            "created_at": created.strftime("%d-%m-%Y") if created else "N/A"
        }
        certificates.append(cert_data)
    
    return certificates

async def get_top_students_by_spu(limit: int = 5) -> List[Dict[str, Any]]:
    db = get_db()
    
    # Get all certificates with student_id and after_normalized
    result = db.table("certificates").select("student_id, after_normalized").execute()
    
    # Calculate total SPU score and certificate count per student
    student_stats = {}
    for cert in result.data:
        student_id = cert["student_id"]
        after_normalized = cert.get("after_normalized", {})
        spu_score = after_normalized.get("spu_score", 0.0)
        
        if student_id not in student_stats:
            student_stats[student_id] = {"total_spu": 0.0, "count": 0}
        
        student_stats[student_id]["total_spu"] += spu_score
        student_stats[student_id]["count"] += 1
    
    # Calculate weighted scores and get top students
    top_students = []
    
    # Calculate weighted score for all students first
    scored_students = []
    for student_id, stats in student_stats.items():
        if not student_id:
            continue
            
        total_spu = stats["total_spu"]
        count = stats["count"]
        
        # Weighted score formula: total_spu * (1 + 0.1 * ln(1 + count))
        weighted_score = total_spu * (1 + 0.1 * math.log(1 + count))
        
        scored_students.append({
            "student_id": student_id,
            "weighted_score": weighted_score,
            "total_spu": total_spu,
            "count": count
        })
    
    # Sort by weighted score descending
    scored_students.sort(key=lambda x: x["weighted_score"], reverse=True)
    
    # Get details for top N students
    for student_entry in scored_students[:limit]:
        student_id = student_entry["student_id"]
        
        # Get student details
        user_result = db.table("Users").select("nama, nim, prodi").eq("id", student_id).execute()
        
        if user_result.data:
            student_data = user_result.data[0]
            top_students.append({
                "nama": student_data.get("nama", ""),
                "nim": student_data.get("nim", ""),
                "prodi": student_data.get("prodi", ""),
                "total_score": round(student_entry["weighted_score"], 2), 
                "avg_score": round(student_entry["weighted_score"] / student_entry["count"], 2) if student_entry["count"] else 0
            })
    
    return top_students

async def get_certificate_count_by_fakultas() -> Dict[str, int]:
    db = get_db()

    # Join certificates with Users to get fakultas in one query
    result = (
        db.table("certificates")
        .select("student_id, Users!inner(fakultas)")
        .execute()
    )

    # Count certificates per fakultas
    count_by_fakultas = {}
    for cert in result.data:
        fakultas = cert.get("Users", {}).get("fakultas", "Unknown")
        count_by_fakultas[fakultas] = count_by_fakultas.get(fakultas, 0) + 1

    return count_by_fakultas