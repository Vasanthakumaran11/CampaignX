import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from pydantic import BaseModel
from app.models.schemas import BrandProfileStatusResponse, BrandLogoResponse, BrandVoiceSampleResponse
from app.services.pdf_parser import process_brand_guideline_pdf
from app.services.color_extractor import extract_dominant_colors_from_image_bytes, deduplicate_palette
from app.services.embedding_service import embed
from app.services.supabase_client import (
    get_supabase_admin,
    upload_file_to_storage,
    get_signed_url,
)
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/brand-profiles", tags=["Ingestion"])

MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024   # 20 MB
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class SampleCopyTextRequest(BaseModel):
    sample_text: str


@router.post("/{profile_id}/upload-guideline", response_model=BrandProfileStatusResponse)
async def upload_brand_guideline(
    profile_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Accepts PDF multipart upload, stores in Supabase Storage, and triggers async ingestion pipeline.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are supported for brand guidelines."
        )

    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase is not configured. Please check backend/.env.")

    # Read and check size
    contents = await file.read()
    if len(contents) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 20MB limit for guideline PDFs."
        )

    # Verify profile exists
    prof_res = client.table("brand_profiles").select("id, name").eq("id", profile_id).execute()
    if not prof_res.data or len(prof_res.data) == 0:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    # Mark status as processing
    client.table("brand_profiles").update({"status": "processing"}).eq("id", profile_id).execute()

    # Launch background task
    background_tasks.add_task(process_brand_guideline_pdf, profile_id, contents, file.filename)

    return BrandProfileStatusResponse(
        id=profile_id,
        name=prof_res.data[0]["name"],
        status="processing",
        raw_guideline_file_path=None
    )


@router.post("/{profile_id}/upload-logo", response_model=List[BrandLogoResponse])
async def upload_brand_logos(
    profile_id: str,
    files: List[UploadFile] = File(...),
    variant_label: Optional[str] = Form(None)
):
    """
    Accepts one or more logo images, saves them to 'brand-logos' storage,
    inserts into brand_logos, and extracts dominant colors.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    settings = get_settings()

    # Check profile
    prof_res = client.table("brand_profiles").select("id").eq("id", profile_id).execute()
    if not prof_res.data:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    allowed_exts = [".png", ".jpg", ".jpeg", ".svg", ".webp"]
    created_logos: List[BrandLogoResponse] = []

    for file in files:
        ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if ext not in allowed_exts:
            continue

        contents = await file.read()
        if len(contents) > MAX_IMAGE_SIZE_BYTES:
            continue

        logo_path = f"{profile_id}/manual_{file.filename}"
        mime_type = file.content_type or "image/png"

        # Upload to Supabase Storage
        upload_file_to_storage(
            bucket=settings.BUCKET_LOGOS,
            path=logo_path,
            file_bytes=contents,
            content_type=mime_type
        )

        # Insert brand_logos record
        logo_insert = client.table("brand_logos").insert({
            "brand_profile_id": profile_id,
            "file_path": logo_path,
            "variant_label": variant_label,
            "min_clear_space_note": "User uploaded logo"
        }).execute()

        if logo_insert.data:
            rec = logo_insert.data[0]
            signed_url = get_signed_url(settings.BUCKET_LOGOS, rec["file_path"])
            created_logos.append(BrandLogoResponse(
                id=rec["id"],
                brand_profile_id=rec["brand_profile_id"],
                file_path=rec["file_path"],
                signed_url=signed_url,
                variant_label=rec.get("variant_label"),
                min_clear_space_note=rec.get("min_clear_space_note"),
                created_at=rec["created_at"],
                updated_at=rec["updated_at"]
            ))

        # Color extraction from uploaded logo
        try:
            extracted_colors = extract_dominant_colors_from_image_bytes(contents, k=4, source="sample_asset")
            for c in extracted_colors:
                client.table("brand_colors").insert({
                    "brand_profile_id": profile_id,
                    "hex_code": c["hex_code"],
                    "usage_label": None,
                    "source": "sample_asset",
                    "frequency_rank": c["frequency_rank"]
                }).execute()
        except Exception as e:
            logger.warning(f"Failed to extract colors from uploaded logo {file.filename}: {e}")

    return created_logos


@router.post("/{profile_id}/upload-samples", response_model=List[BrandVoiceSampleResponse])
async def upload_brand_voice_samples(
    profile_id: str,
    payload: Optional[SampleCopyTextRequest] = None,
    file: Optional[UploadFile] = File(None)
):
    """
    Accepts sample approved copy as raw text or text file, generates embeddings,
    and saves to brand_voice_samples table.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    text_to_process = ""
    if payload and payload.sample_text:
        text_to_process = payload.sample_text
    elif file:
        contents = await file.read()
        try:
            text_to_process = contents.decode("utf-8")
        except UnicodeDecodeError:
            text_to_process = contents.decode("latin-1", errors="ignore")

    if not text_to_process.strip():
        raise HTTPException(status_code=400, detail="No sample text provided.")

    # Split into meaningful paragraphs
    paragraphs = [p.strip() for p in text_to_process.split("\n\n") if len(p.strip()) > 20]
    if not paragraphs:
        paragraphs = [text_to_process.strip()]

    created_samples: List[BrandVoiceSampleResponse] = []

    for para in paragraphs:
        vector = embed(para)
        res = client.table("brand_voice_samples").insert({
            "brand_profile_id": profile_id,
            "sample_text": para,
            "embedding": vector,
            "source": "user_uploaded"
        }).execute()

        if res.data:
            rec = res.data[0]
            created_samples.append(BrandVoiceSampleResponse(
                id=rec["id"],
                brand_profile_id=rec["brand_profile_id"],
                sample_text=rec["sample_text"],
                source=rec.get("source", "user_uploaded"),
                has_embedding=True,
                embedding_dimension=384,
                created_at=rec["created_at"],
                updated_at=rec["updated_at"]
            ))

    return created_samples
