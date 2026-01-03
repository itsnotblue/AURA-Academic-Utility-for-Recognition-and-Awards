from typing import Optional
from pydantic import BaseModel

class Staff(BaseModel):
    id: str
    username: str
    nama: str
    kode_staff: str
    nip: str
    jabatan: str
    email: str