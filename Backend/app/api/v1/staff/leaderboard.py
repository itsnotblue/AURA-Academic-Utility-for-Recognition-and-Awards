from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from schemas.globaltypes import APIResponse
from controllers.staff.leaderboard_controller import (
    get_leaderboard_aggregated,
    search_certificates_similarity
)

router = APIRouter(
    prefix="/staff",
    tags=["Leaderboard"]
)

@router.get("/leaderboard", response_model=APIResponse[List[Dict[str, Any]]])
async def get_staff_leaderboard(
    limit: int = 10
) -> APIResponse[List[Dict[str, Any]]]:
    try:
        leaderboard = await get_leaderboard_aggregated(limit)
        
        return APIResponse[List[Dict[str, Any]]](
            status_code=200,
            message="Leaderboard data retrieved successfully",
            data=leaderboard
        )
        
    except HTTPException as e:
        return APIResponse[List[Dict[str, Any]]](
            status_code=e.status_code,
            message=e.detail,
            error=str(e.detail)
        )
    except Exception as e:
        return APIResponse[List[Dict[str, Any]]](
            status_code=500,
            message="Failed to retrieve leaderboard data",
            error=str(e)
        )

@router.get("/search", response_model=APIResponse[List[Dict[str, Any]]])
async def search_staff_certificates(
    query: str,
    limit: int = 5
) -> APIResponse[List[Dict[str, Any]]]:
    try:
        results = await search_certificates_similarity(query, limit)
        
        return APIResponse[List[Dict[str, Any]]](
            status_code=200,
            message="Search results retrieved successfully",
            data=results
        )
        
    except HTTPException as e:
        return APIResponse[List[Dict[str, Any]]](
            status_code=e.status_code,
            message=e.detail,
            error=str(e.detail)
        )
    except Exception as e:
        return APIResponse[List[Dict[str, Any]]](
            status_code=500,
            message="Failed to search certificates",
            error=str(e)
        )