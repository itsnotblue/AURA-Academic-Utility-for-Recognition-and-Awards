from sre_parse import CATEGORY_UNI_DIGIT
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Dict, Any
from pydantic import BaseModel
import uuid
from schemas.globaltypes import APIResponse
from config.database import get_db
from controllers.certificates.certificates_controller import (
    upload_certificate as upload_certificate_controller,
    complete_certificate as complete_certificate_controller
)

router = APIRouter(
    prefix="/users/certificates",
    tags=["User Certificates"]
)

class ParsedData(BaseModel):
        nama_mahasiswa: str = ""
        event_name: str = ""
        rank_raw: str = ""
        level_raw: str = ""
        date_issued: str = ""
        category_raw: str = ""
        domain_raw: str = ""
        confidence: float = 0.0

class SubmitRequest(BaseModel):
    document_id: str
    parsed: ParsedData

class UploadResponse(BaseModel):
    document_id: str = ""
    nama_event: str = ""
    domain: str = ""
    category: str = ""
    rank: str = ""
    level: str = ""
    date: str = ""

async def get_current_user_id() -> str:
    return "8ae7d470-37af-413d-9a79-3ec90eb40a5c"  # placeholder user ID

@router.post("/upload", response_model=APIResponse)
async def upload_certificate(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
) -> APIResponse:
    try:
        result = await upload_certificate_controller(file, user_id)
        
        return APIResponse(
            status_code=200,
            message="Certificate uploaded and parsed successfully",
            data=result
        )
        
    except HTTPException as e:
        return APIResponse(
            status_code=e.status_code,
            message=e.detail,
            error=str(e.detail)
        )
    except Exception as e:
        return APIResponse(
            status_code=500,
            message="Certificate upload failed",
            error=str(e)
        )

@router.post("/submit", response_model=APIResponse)
async def submit_certificate(
    request: SubmitRequest,
    user_id: str = Depends(get_current_user_id)
) -> APIResponse:

    try:
        processed_data = await complete_certificate_controller(request.dict())
        
        return APIResponse(
            status_code=200,
            message="Certificate submitted successfully",
            data=processed_data
        )
        
    except HTTPException as e:
        return APIResponse(
            status_code=e.status_code,
            message=e.detail,
            error=str(e.detail)
        )
    except Exception as e:
        return APIResponse(
            status_code=500,
            message="Certificate submission failed",
            error=str(e)
        )