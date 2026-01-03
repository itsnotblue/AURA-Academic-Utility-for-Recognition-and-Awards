from typing import Optional
from pydantic import BaseModel

class Users(BaseModel):
    id: str
    username: str
    nama: str
    nim: str
    prodi: str
    fakultas: str
    angkatan: str
    profile_pic: Optional[str] = None
