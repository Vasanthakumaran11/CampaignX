"""
FastAPI Router for Phase 4 Poster Generation Pipeline
"""

import os
import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.models.schemas import PosterGenerationRequest, PosterGenerationResponse
from app.services.background_generation_service import generate_poster_background
from app.services.poster_compositor import composite_poster
from app.services.visual_compliance_service import audit_poster_visual_compliance
from app.services.supabase_client import get_supabase_admin
from app.config import get_settings

router = APIRouter(prefix="/api/campaign-briefs", tags=["Poster Generation"])

# Storage directory for local static serving of generated posters
POSTERS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "posters")
os.makedirs(POSTERS_DIR, exist_ok=True)

@router.post("/{brief_id}/generate-poster", response_model=PosterGenerationResponse)
async def generate_poster_for_brief(brief_id: str, payload: PosterGenerationRequest):
    """
    Triggers poster generation pipeline:
    1. Fetches brief context & brand guidelines
    2. Generates background image (HF API / Pillow renderer)
    3. Programmatically overlays logo & slogan
    4. Automatically triggers Visual Compliance Audit
    """
    settings = get_settings()
    supabase = get_supabase_admin()

    # 1. Fetch Campaign Brief
    brief_res = supabase.table("campaign_briefs").select("*").eq("id", brief_id).execute()
    if not brief_res.data:
        raise HTTPException(status_code=404, detail="Campaign brief not found")
    
    brief = brief_res.data[0]
    brand_profile_id = brief["brand_profile_id"]

    # 2. Fetch Brand Profile (Colors, Logos, Rules)
    brand_res = supabase.table("brand_profiles").select("*").eq("id", brand_profile_id).execute()
    brand_name = brand_res.data[0]["name"] if brand_res.data else "CampaignX AI"

    logo_res = supabase.table("brand_logos").select("*").eq("brand_profile_id", brand_profile_id).execute()
    logo_path = logo_res.data[0]["file_path"] if logo_res.data else None

    # Construct prompt & slogan
    prompt = payload.custom_prompt or f"Modern high impact marketing background for {brief.get('product_or_feature', 'brand')}, {brief.get('campaign_goal', 'campaign')}"
    slogan = payload.overlay_text or f"{brief.get('product_or_feature', 'Feature')}: {brief.get('campaign_goal', 'Scale with confidence.')}"

    # 3. Generate background & composite
    bg_img = generate_poster_background(prompt)
    final_poster, logo_bbox = composite_poster(
        background_image=bg_img,
        logo_image_path=logo_path,
        slogan_text=slogan,
        brand_name=brand_name
    )

    poster_filename = f"poster_{uuid.uuid4().hex[:12]}.png"
    local_path = os.path.join(POSTERS_DIR, poster_filename)
    final_poster.save(local_path, format="PNG")

    signed_url = f"http://127.0.0.1:8000/static/posters/{poster_filename}"

    # Save to Supabase poster_generations
    gen_id = str(uuid.uuid4())
    record = {
        "id": gen_id,
        "campaign_brief_id": brief_id,
        "brand_profile_id": brand_profile_id,
        "background_prompt": prompt,
        "final_poster_path": local_path,
        "logo_placement": logo_bbox,
        "overlay_text": slogan,
        "status": "ready"
    }

    try:
        supabase.table("poster_generations").insert(record).execute()
    except Exception as e:
        print(f"[!] Warning on poster DB save: {e}")

    # 4. Automatically trigger Visual Compliance Audit
    audit_res = audit_poster_visual_compliance(
        poster_image_path=local_path,
        brand_logo_path=logo_path,
        approved_slogan=slogan
    )

    audit_id = str(uuid.uuid4())
    audit_record = {
        "id": audit_id,
        "poster_generation_id": gen_id,
        "uploaded_image_path": local_path,
        "brand_profile_id": brand_profile_id,
        "logo_detected": audit_res["logo_detected"],
        "logo_match_score": audit_res["logo_match_score"],
        "logo_bbox": audit_res["logo_bbox"],
        "color_match_score": audit_res["color_match_score"],
        "text_match_result": audit_res["text_match_result"],
        "overall_visual_score": audit_res["overall_visual_score"],
        "status": audit_res["status"]
    }

    try:
        supabase.table("visual_compliance_audits").insert(audit_record).execute()
    except Exception as e:
        print(f"[!] Warning on visual audit DB save: {e}")

    return {
        "id": gen_id,
        "visual_audit_id": audit_id,
        "campaign_brief_id": brief_id,
        "brand_profile_id": brand_profile_id,
        "background_prompt": prompt,
        "final_poster_path": local_path,
        "signed_poster_url": signed_url,
        "logo_placement": logo_bbox,
        "overlay_text": slogan,
        "status": "ready",
        "created_at": "2026-08-27T16:00:00Z"
    }
