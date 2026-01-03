from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from schemas.globaltypes import APIResponse
from config.database import get_db


router = APIRouter(
    prefix="/users",
    tags=["Dashboard"]
)

class CertificateStats(BaseModel):
    validated_count: int
    not_validated_count: int
    akademik_count: int
    non_akademik_count: int

class CertificateEvent(BaseModel):
    event_name: str
    date_issued: Optional[str]
    category: str
    status: str
    spu_score: float

class DashboardResponse(BaseModel):
    nama: str
    nim: str
    prodi: str
    angkatan: int
    certificate_stats: CertificateStats
    events: List[CertificateEvent]
    avg_spu_score: float

async def get_current_user_id() -> str:
    return "8ae7d470-37af-413d-9a79-3ec90eb40a5c" # placeholder pake users nomor 1 misalkan  

@router.get("/dashboard", response_model=APIResponse[DashboardResponse])
async def get_user_dashboard(
    user_id: str = Depends(get_current_user_id)
) -> APIResponse[DashboardResponse]:
    try:
        db = get_db()
        
        # 1. Get users data
        user_result = db.table("Users").select("nama, nim, prodi, angkatan").eq("id", user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_result.data[0]
        
        # 2. Get certificate stat
        certs_result = db.table("certificates").select("status, created_at, parsed, after_normalized").eq("student_id", user_id).execute()
        
        validated_count = 0
        not_validated_count = 0
        akademik_count = 0
        non_akademik_count = 0
        events = []
        
        for cert in certs_result.data:
            # Count status
            if cert.get("status") == "validated":
                validated_count += 1
            else:
                not_validated_count += 1
            
            # Count category from normalized field
            parsed = cert.get("parsed", {})
            if isinstance(parsed, dict):
                category = parsed.get("category_raw", "")
                if "akademik" == category.lower():
                    akademik_count += 1
                else:
                    non_akademik_count += 1
            
            # Get event data from parsed field and other fields
            parsed = cert.get("parsed", {})
            after_normalized = cert.get("after_normalized", {})
            created = datetime.fromisoformat(cert.get("created_at")) if cert.get("created_at") else None
            
            event_data = {
                "event_name": parsed.get("event_name", "") if isinstance(parsed, dict) else "",
                "date_issued": created.strftime("%d-%m-%Y") if created else None,
                "category": parsed.get("category_raw", "") if isinstance(parsed, dict) else "",
                "status": cert.get("status", ""),
                "spu_score": after_normalized.get("spu_score", 0.0) if isinstance(after_normalized, dict) else 0.0
            }
            events.append(event_data)
        
        # Calculate average SPU score
        avg_spu_score = sum(event["spu_score"] for event in events) / len(events) if events else 0.0

        # 3. Prepare response
        dashboard_data = {
            "nama": user_data["nama"],
            "nim": user_data["nim"],
            "prodi": user_data["prodi"],
            "angkatan": user_data["angkatan"],
            "certificate_stats": {
                "validated_count": validated_count,
                "not_validated_count": not_validated_count,
                "akademik_count": akademik_count,
                "non_akademik_count": non_akademik_count
            },
            "events": events,
            "avg_spu_score": round(avg_spu_score * 100, 2)
        }
        
        return APIResponse[DashboardResponse](
            status_code=200,
            message="Dashboard data retrieved successfully",
            data=dashboard_data
        )
        
    except HTTPException as e:
        return APIResponse[DashboardResponse](
            status_code=e.status_code,
            message=e.detail,
            error=str(e.detail)
        )
    except Exception as e:
        return APIResponse[DashboardResponse](
            status_code=500,
            message="Failed to retrieve dashboard data",
            error=str(e)
        )