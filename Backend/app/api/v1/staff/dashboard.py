from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from schemas.globaltypes import APIResponse
from controllers.staff.dashboard_controller import (
    get_staff_profile_data,
    get_certificate_status_counts,
    get_unique_students_by_fakultas,
    get_recent_certificates,
    get_top_students_by_spu,
    get_certificate_count_by_fakultas,
)

router = APIRouter(
    prefix="/staff",
    tags=["Dashboard"]
)

class StaffProfile(BaseModel):
    nama: str
    nip: str
    jabatan: str
    kode_staff: str

class CertificateStatusCounts(BaseModel):
    validated_count: int
    processed_count: int
    kampus_count: int
    nasional_count: int
    internasional_count: int

class StudentsByFakultas(BaseModel):
    unique_students_count: int
    count_students_by_fakultas: Dict[str, int]

class RecentCertificate(BaseModel):
    student_name: str
    event_name: str
    status: str
    spu_score: float
    fakultas: str
    created_at: Optional[str] = None

class TopStudent(BaseModel):
    nama: str
    nim: str
    prodi: str
    total_score: float
    avg_score: float

class DashboardResponse(BaseModel):
    staff_profile: StaffProfile
    certificate_status_counts: CertificateStatusCounts
    students_by_fakultas: StudentsByFakultas
    recent_certificates: List[RecentCertificate]
    top_students: List[TopStudent]
    certificate_count_by_fakultas: Dict[str, int]

async def get_current_staff_id() -> str:
    return "2d50971e-9fd2-4aeb-823b-7320e95db92b" # dummy staff ID

@router.get("/dashboard", response_model=APIResponse[DashboardResponse])
async def get_staff_dashboard(
    staff_id: str = Depends(get_current_staff_id)
) -> APIResponse[DashboardResponse]:
    try:
        # 1. Get staff profile data
        staff_profile = await get_staff_profile_data(staff_id)
        
        # 2. Get certificate status counts
        certificate_status_counts = await get_certificate_status_counts()
        
        # 3. Get unique students by fakultas
        students_by_fakultas = await get_unique_students_by_fakultas()
        
        # 4. Get recent certificates
        recent_certificates = await get_recent_certificates()
        
        # 5. Get top 5 students by SPU score
        top_students = await get_top_students_by_spu(limit=5)

        # 6. Count Certificate per Fakultas
        certificate_count_by_fakultas = await get_certificate_count_by_fakultas()
        
        # 7. Prepare response
        dashboard_data = {
            "staff_profile": staff_profile,
            "certificate_status_counts": certificate_status_counts,
            "students_by_fakultas": students_by_fakultas,
            "recent_certificates": recent_certificates,
            "top_students": top_students,
            "certificate_count_by_fakultas": certificate_count_by_fakultas
        }
        
        return APIResponse[DashboardResponse](
            status_code=200,
            message="Staff dashboard data retrieved successfully",
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
            message="Failed to retrieve staff dashboard data",
            error=str(e)
        )