from typing import Dict, Any, List
from config.database import get_db
from fastapi import HTTPException
from datetime import datetime

async def get_current_staff_id() -> str:
    return "2d50971e-9fd2-4aeb-823b-7320e95db92b"

async def get_certificate_list() -> List[Dict[str, Any]]:
    db = get_db()
    
    # Get certificates with status and after_normalized data
    result = db.table("certificates").select("id, evidence_url, parsed, status, after_normalized, created_at, Users(nama, nim, prodi, fakultas)").execute()
    
    events = []
    for cert in result.data:
        parsed = cert.get("parsed", {})
        user = cert.get("Users", {})
        created = datetime.fromisoformat(cert.get("created_at", ""))
        
        event_data = {
            "id": cert.get("id", ""),
            "evidence_url": cert.get("evidence_url", "") if isinstance(cert, dict) else "",
            "event_name": parsed.get("event_name", "") if isinstance(parsed, dict) else "",
            "category": parsed.get("category_raw", "") if isinstance(parsed, dict) else "",
            "tingkat": parsed.get("level_raw", "") if isinstance(parsed, dict) else "",
            "created_at": created.strftime("%d-%m-%Y") if created else "",
            "spu_score": cert.get("after_normalized", {}).get("spu_score", 0.0) * 100,
            "status": cert.get("status", ""),
            "nama_mahasiswa": user.get("nama", "") if isinstance(user, dict) else "",
            "nim": user.get("nim", "") if isinstance(user, dict) else "",
            "prodi": user.get("prodi", "") if isinstance(user, dict) else "",
            "fakultas": user.get("fakultas", "") if isinstance(user, dict) else "",
        }
        events.append(event_data)
    
    return events


async def validate_certificate(certificate_id: str) -> Dict[str, Any]:
    db = get_db()
    
    # Check if certificate exists and has status 'processed'
    result = db.table("certificates").select("id, status").eq("id", certificate_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    certificate = result.data[0]
    
    if certificate.get("status") != "processed":
        raise HTTPException(status_code=400, detail="Certificate is not in processed status")

    staff_id = await get_current_staff_id()
    
    # Update the certificate status
    update_data = {
        "status": "validated",
        "validated_by": staff_id, 
        "updated_at": datetime.now().isoformat()
    }
    
    db.table("certificates").update(update_data).eq("id", certificate_id).execute()
    
    # Return updated certificate data
    updated_result = db.table("certificates").select("id, status, parsed").eq("id", certificate_id).execute()
    
    if updated_result.data:
        updated_cert = updated_result.data[0]
        parsed = updated_cert.get("parsed", {})

        staff_result = db.table("Staff").select("id, nama").eq("id", staff_id).execute()
        
        if not staff_result.data:
            raise HTTPException(status_code=404, detail="Staff not found")
        
        staff = staff_result.data[0]
        
        return {
            "id": updated_cert.get("id"),
            "status": updated_cert.get("status"),
            "event_name": parsed.get("event_name", "") if isinstance(parsed, dict) else "",
            "nama_mahasiswa": parsed.get("nama_mahasiswa", "") if isinstance(parsed, dict) else "",
            "validated_at": update_data["updated_at"],
            "validated_by": staff
        }
    
    raise HTTPException(status_code=500, detail="Failed to retrieve updated certificate")


async def certificate_detail(certificate_id: str) -> Dict[str, Any]:
    db = get_db()
    
    try:
        # First get the certificate data
        cert_result = db.table("certificates").select("id, status, parsed, after_normalized, created_at, student_id").eq("id", certificate_id).execute()
        
        if not cert_result.data:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        certificate = cert_result.data[0]
        parsed = certificate.get("parsed", {})
        after_normalized = certificate.get("after_normalized", {})
        created = datetime.fromisoformat(certificate.get("created_at", ""))
        student_id = certificate.get("student_id", "")
        
        # Get student data
        user_result = db.table("Users").select("id, nama, nim").eq("id", student_id).execute()
        user_data = user_result.data[0] if user_result.data else {}
        
        return {
            "id": certificate.get("id"),
            "status": certificate.get("status"),
            "event_name": parsed.get("event_name", "") if isinstance(parsed, dict) else "",
            "category": parsed.get("category_raw", "") if isinstance(parsed, dict) else "",
            "tingkat": parsed.get("level_raw", "") if isinstance(parsed, dict) else "",
            "spu": round(after_normalized.get("spu_score", 0.0) * 100) if isinstance(after_normalized, dict) else 0,
            "created_at": created.strftime("%d-%m-%Y") if created else "",
            "user": {
                "id": user_data.get("id", ""),
                "nama": user_data.get("nama", ""),
                "nim": user_data.get("nim", "")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving certificate detail: {str(e)}")
    