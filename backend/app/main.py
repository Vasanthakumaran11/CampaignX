import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.services.supabase_client import get_supabase_admin, ensure_storage_buckets
from app.services.embedding_service import get_embedding_model, get_model_info
from app.api.brand_profiles import router as brand_profiles_router
from app.api.ingestion import router as ingestion_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("campaignx")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CampaignX FastAPI Backend...")
    settings = get_settings()

    # 1. Check & Ensure Supabase Storage Buckets
    client = get_supabase_admin()
    if client:
        try:
            ensure_storage_buckets()
        except Exception as e:
            logger.warning(f"Could not initialize Supabase storage buckets on startup: {e}")
    else:
        logger.warning("Supabase credentials not configured or incomplete. Update backend/.env with actual keys.")

    # 2. Embedding model will be loaded on demand (or background thread)
    import threading
    threading.Thread(target=get_embedding_model, daemon=True).start()
    logger.info("Embedding service background initialization triggered.")

    yield

    logger.info("Shutting down CampaignX FastAPI Backend.")


app = FastAPI(
    title="CampaignX Brand Compliance Studio API",
    description="Phase 1: Foundation & Brand Profile Ingestion Pipeline",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Setup
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

from app.api.brand_profiles import router as brand_profiles_router
from app.api.ingestion import router as ingestion_router
from app.api.campaign_briefs import router as campaign_briefs_router
from app.api.compliance import router as compliance_router
from app.api.poster_generation import router as poster_generation_router
from app.api.visual_compliance import router as visual_compliance_router

# Include Routers
app.include_router(brand_profiles_router)
app.include_router(ingestion_router)
app.include_router(campaign_briefs_router)
app.include_router(compliance_router)
app.include_router(poster_generation_router)
app.include_router(visual_compliance_router)


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint returning system status, Supabase connectivity, and embedding model info.
    """
    settings = get_settings()
    client = get_supabase_admin()
    supabase_connected = False
    supabase_message = "Credentials missing in backend/.env"

    if client:
        try:
            # Quick query to test connection
            res = client.table("brand_profiles").select("id").limit(1).execute()
            supabase_connected = True
            supabase_message = "Connected to Supabase database"
        except Exception as e:
            supabase_message = f"Supabase error: {str(e)}"

    model_info = get_model_info()
    model_info["device"] = settings.EMBEDDING_DEVICE

    return {
        "status": "healthy" if supabase_connected else "degraded",
        "phase": "Phase 1 - Brand Kit Ingestion",
        "supabase": {
            "connected": supabase_connected,
            "url": settings.SUPABASE_URL if "your-project-ref" not in settings.SUPABASE_URL else "not_configured",
            "message": supabase_message,
        },
        "embedding_model": model_info,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": "CampaignX - AI Marketing Campaign & Brand Compliance Studio",
        "phase": "Phase 1: Foundation & Brand Profile Ingestion",
        "docs_url": "/docs",
        "health_url": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.FASTAPI_HOST, port=settings.FASTAPI_PORT, reload=True)
