from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel
from datetime import date

T = TypeVar('T')

class APIResponse(GenericModel, Generic[T]):
    status_code: int # HTTP status 200, 300, 400, dll
    message: str 
    data: Optional[T] = None
    error: Optional[str] = None

class LeaderboardEntry(BaseModel):
    student_id: str
    student_name: str
    total_spu: float = Field(ge=0, description="Total SPU score")
    rank: int = Field(ge=1, description="Leaderboard rank")
    certificates_count: int = Field(ge=0, description="Number of certificates")
    last_achievement: Optional[date] = None

class LeaderboardSPU(BaseModel):
    period: str 
    entries: List[LeaderboardEntry]
    # generated_at: datetime
    total_students: int
