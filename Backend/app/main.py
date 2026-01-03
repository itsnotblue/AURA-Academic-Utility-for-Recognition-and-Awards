from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.auth import auth
from api.v1.users import dashboard, prestasi, certificate
from api.v1.staff import certificate as certificatestaff, dashboard as dashboardstaff, leaderboard

app = FastAPI(
    title="AURA API",
    description="API for Academic Utility for Recognition and Awards",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Routes
app.include_router(auth.router, prefix="/api/v1")

# Users Routes
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(prestasi.router, prefix="/api/v1")
app.include_router(certificate.router, prefix="/api/v1")

# Staff Routes
app.include_router(dashboardstaff.router, prefix="/api/v1")
app.include_router(certificatestaff.router, prefix="/api/v1")
app.include_router(leaderboard.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "AURA API is running"}