import os
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from config.database import get_db
from pwdlib import PasswordHash

# Config
SECRET_KEY = os.getenv("SECRET_KEY", "AURA12345")
ALGORITHM = "HS256"
TOKEN_EXPIRE = 60 * 24 * 14 # 2 minggu
security_scheme = HTTPBearer()
# Argon2
password_hash = PasswordHash.recommended()

# Helper Functions
def verify_password(plain_password, hashed_password):
    try:
        return password_hash.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Logic Functions
async def login_user(username: str, password: str):
    db = get_db()
    user_data = None
    role = None

    # 1. Check Users Table
    user_response = db.table("Users").select("*").eq("username", username).execute()
    if user_response.data:
        potential_user = user_response.data[0]
        
        if verify_password(password, potential_user["password"]):
            user_data = potential_user
            role = "User"

        
    # 2. If no users found, Try Staff
    if not user_data:
        staff_resp = db.table("Staff").select("*").eq("username", username).execute()
        if staff_resp.data:
            potential_staff = staff_resp.data[0]
            if verify_password(password, potential_staff["password"]):
                user_data = potential_staff
                role = "Staff"

    # 3. Final Data check
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect username or password" + str(user_data)
        )

    # 4. Generate JWT Token
    access_token_expires = timedelta(minutes=TOKEN_EXPIRE)
    token_payload = {
        "sub": str(user_data["id"]), 
        "role": role, 
        "username": user_data["username"]
    }
    
    access_token = create_access_token(data=token_payload, expires_delta=access_token_expires)
        
    refresh_token_expires = timedelta(days=TOKEN_EXPIRE)
    refresh_token = create_refresh_token(data=token_payload, expires_delta=refresh_token_expires)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user_data["id"],
        "role": role,
        "expires_at": (datetime.now(timezone.utc) + access_token_expires).timestamp(),
    }

async def verify_token_logic(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") == "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not allowed for authentication",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def refresh_access_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        access_token_expires = timedelta(minutes=TOKEN_EXPIRE)
        new_access_token = create_access_token(
            data={
                "sub": payload["sub"],
                "role": payload["role"],
                "username": payload["username"]
            },
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )