from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from pydantic import BaseModel
from schemas.globaltypes import APIResponse
from controllers.certificates.users.prestasi_controller import (
    get_user_profile_data,
    get_top_certificates,
    get_certificate_statistics,
    get_user_history
)

router = APIRouter(
    prefix="/users",
    tags=["History"]
)

class HistoryResponse(BaseModel):
    events: List[Dict[str, Any]]

class PrestasiResponse(BaseModel):
    profile: Dict[str, Any]
    top_certificates: List[Dict[str, Any]]
    statistics: Dict[str, Any]

async def get_current_user_id() -> str:
    return "8ae7d470-37af-413d-9a79-3ec90eb40a5c" # placeholder pake users nomor 1 misalkan  

@router.get("/history", response_model=APIResponse[HistoryResponse])
async def get_user_history_endpoint(
    user_id: str = Depends(get_current_user_id)
) -> APIResponse[HistoryResponse]:
    try:
        # Get user history from controller
        events = await get_user_history(user_id)
        
        # Prepare response
        history_data = {
            "events": events,
        }
        
        return APIResponse[HistoryResponse](
            status_code=200,
            message="History retrieved successfully",
            data=history_data
        )
        
    except HTTPException as e:
        return APIResponse[HistoryResponse](
            status_code=e.status_code,
            message=e.detail,
            error=str(e.detail)
        )
    except Exception as e:
        return APIResponse[HistoryResponse](
            status_code=500,
            message="Failed to retrieve history data",
            error=str(e)
        )

@router.get("/prestasi", response_model=APIResponse[PrestasiResponse])
async def get_user_prestasi(
    user_id: str = Depends(get_current_user_id)
) -> APIResponse[PrestasiResponse]:
    try:
        # 1. Get user profile data
        profile = await get_user_profile_data(user_id)
        
        # 2. Get top 3 certificates by SPU score
        top_certificates = await get_top_certificates(user_id, limit=3)
        
        # 3. Get certificate statistics
        statistics = await get_certificate_statistics(user_id)
        
        # 4. Prepare response
        prestasi_data = {
            "profile": profile,
            "top_certificates": top_certificates,
            "statistics": statistics
        }
        
        return APIResponse[PrestasiResponse](
            status_code=200,
            message="Prestasi data retrieved successfully",
            data=prestasi_data
        )
        
    except HTTPException as e:
        return APIResponse[PrestasiResponse](
            status_code=e.status_code,
            message=e.detail,
            error=str(e.detail)
        )
    except Exception as e:
        return APIResponse[PrestasiResponse](
            status_code=500,
            message="Failed to retrieve prestasi data",
            error=str(e)
        )