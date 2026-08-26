import os
from functools import lru_cache
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supabase Credentials
    SUPABASE_URL: str = "https://your-project-ref.supabase.co"
    SUPABASE_ANON_KEY: str = Field(
        default="your-anon-public-key",
        validation_alias="SUPABASE_ANON_KEY"
    )
    SUPABASE_SERVICE_ROLE_KEY: str = Field(
        default="your-service-role-key",
        validation_alias="SUPABASE_SERVICE_ROLE_KEY"
    )

    # Optional aliases
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = None
    SUPABASE_SECRET_KEY: Optional[str] = None

    # Server Settings
    FASTAPI_PORT: int = 8000
    FASTAPI_HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # Embedding / ML
    EMBEDDING_DEVICE: str = "cpu"
    BASE_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    FINE_TUNED_MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "tone-encoder")

    # Storage Buckets
    BUCKET_GUIDELINES: str = "brand-guidelines"
    BUCKET_LOGOS: str = "brand-logos"
    BUCKET_SAMPLES: str = "brand-samples"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Fallback aliases
        if self.SUPABASE_ANON_KEY == "your-anon-public-key" and self.SUPABASE_PUBLISHABLE_KEY:
            self.SUPABASE_ANON_KEY = self.SUPABASE_PUBLISHABLE_KEY
        if self.SUPABASE_SERVICE_ROLE_KEY == "your-service-role-key" and self.SUPABASE_SECRET_KEY:
            self.SUPABASE_SERVICE_ROLE_KEY = self.SUPABASE_SECRET_KEY

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
