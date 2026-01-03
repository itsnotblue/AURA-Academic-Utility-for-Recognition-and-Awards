import os
from pathlib import Path
from supabase import create_client, Client
from pydantic_settings import BaseSettings

env_path = Path(__file__).resolve().parent.parent.parent / ".env"

class DatabaseSettings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE: str
    SUPABASE_ANON_PUBLIC: str

    class Config:
        env_file = str(env_path)
        extra = "ignore"

db_settings = DatabaseSettings()

class SupabaseClient:
    _instance: Client = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._instance is None:
            cls._instance = create_client(
                db_settings.SUPABASE_URL,
                db_settings.SUPABASE_SERVICE_ROLE
            )
        return cls._instance

def get_db() -> Client:
    return SupabaseClient.get_client()