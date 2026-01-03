from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel

class ParsedData(BaseModel):
    rank_raw: str
    level_raw: str
    confidence: float 
    domain_raw: str
    event_name: str
    date_issued: Optional[date] = None
    category_raw: str
    nama_mahasiswa: str

class NormalizedData(BaseModel):
    domain: str
    category: str
    rank_norm: int
    level_norm: int
    date_issued: Optional[date] = None

class BeforeNormalized(BaseModel):
    rank_raw: str
    level_raw: str
    category_raw: str

class AfterNormalized(BaseModel):
    rank_norm: int
    spu_score: float
    level_norm: int
    category_norm: int

class Certificate(BaseModel):
    id: str
    document_id: str
    student_id: str
    evidence_url: str
    raw_text_sha256: str
    parsed: ParsedData
    normalized: NormalizedData
    confidence_extraction: float
    status:str
    created_at: datetime
    updated_at: Optional[datetime] = None
    event_category: str
    embedding: List[float]
    before_normalized: BeforeNormalized
    after_normalized: AfterNormalized

