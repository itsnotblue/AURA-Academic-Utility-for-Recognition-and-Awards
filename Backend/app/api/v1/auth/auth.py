from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
from schemas.globaltypes import APIResponse

from controllers.auth.auth_controllers import login_user, verify_token_logic, refresh_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

class LoginRequest(BaseModel):
    username: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/login")
async def login(request: LoginRequest):
    try:
        result = await login_user(request.username, request.password)

        return APIResponse(
            status_code=200,
            content={
                "message": "Login successful",
                "data": result
            }
        )

    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={
                "message": e.detail,
                "error": str(e.detail)
            }
        )

@router.post("/refresh")
async def refresh_token(request: RefreshRequest):
    try:
        result = await refresh_access_token(request.refresh_token)
        return JSONResponse(
            status_code=200,
            content={
                "message": "Token refreshed successfully",
                "data": result
            }
        )
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={
                "message": e.detail,
                "error": str(e.detail)
            }
        )


@router.get("/verify")
async def verify_token(user: Dict[str, Any] = Depends(verify_token_logic)):
    return JSONResponse(
        status_code=200,
        content={
            "message": "Token is valid",
            "data": {
                "user_id": user.get("sub"),
                "email": user.get("email"),
                "role": user.get("role")
            }
        }
    )

@router.get("/me")
async def get_my_profile(user: Dict[str, Any] = Depends(verify_token_logic)):
    return JSONResponse(
        status_code=200,
        content={
            "message": "Profile retrieved successfully",
            "data": {
                "user": user
            }
        }
    )