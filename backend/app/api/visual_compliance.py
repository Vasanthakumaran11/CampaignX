"""
FastAPI Router for Phase 4 Visual Compliance Audit
"""

import os
import uuid
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from datetime import datetime, timezone
from typing import Optional
from app.models.schemas import VisualComplianceAuditResponse
from app.services.visual_compliance_service import audit_poster_visual_compliance
from app.services.supabase_client import get_supabase_admin
from app.config import get_settings

router = APIRouter(prefix="/api", tags=["Visual Compliance Audit"])

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

@router.post("/brand-profiles/{brand_id}/visual-compliance/audit", response_model=VisualComplianceAuditResponse)
async def audit_uploaded_poster(
    brand_id: str,
    file: UploadFile = File(...),
    slogan: Optional[str] = Form(None)
):
    """
    Audits a user-uploaded poster image against the brand's visual identity.
    """
    supabase = get_supabase_admin()
    settings = get_settings()

    # Save uploaded file
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    temp_filename = f"upload_{uuid.uuid4().hex[:12]}.{file_ext}"
    local_path = os.path.join(UPLOADS_DIR, temp_filename)

    with open(local_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    signed_url = f"http://127.0.0.1:8000/static/uploads/{temp_filename}"

    # Fetch brand guidelines
    colors_res = supabase.table("brand_colors").select("hex_code").eq("brand_profile_id", brand_id).execute()
    brand_colors = [c["hex_code"] for c in colors_res.data] if colors_res.data else []

    logo_res = supabase.table("brand_logos").select("file_path").eq("brand_profile_id", brand_id).execute()
    brand_logo = logo_res.data[0]["file_path"] if logo_res.data else None

    # Resolve brand logo to a valid local file path
    local_logo_path = None
    if brand_logo:
        if os.path.exists(brand_logo):
            local_logo_path = brand_logo
        else:
            # Download from Supabase Storage
            try:
                storage_bytes = supabase.storage.from_(settings.BUCKET_LOGOS).download(brand_logo)
                if storage_bytes:
                    logo_ext = brand_logo.split(".")[-1] if "." in brand_logo else "png"
                    local_logo_path = os.path.join(UPLOADS_DIR, f"brand_logo_{brand_id[:8]}_{uuid.uuid4().hex[:6]}.{logo_ext}")
                    with open(local_logo_path, "wb") as f:
                        f.write(storage_bytes)
            except Exception as dl_err:
                print(f"[!] Warning downloading brand logo from Supabase storage: {dl_err}")

    # Fetch restricted terms & rules
    rules_res = supabase.table("brand_guideline_rules").select("*").eq("brand_profile_id", brand_id).execute()
    restricted_terms = []
    if rules_res.data:
        for r in rules_res.data:
            if r.get("rule_text"):
                restricted_terms.append(r["rule_text"].strip())

    # Perform Visual Audit
    audit_res = audit_poster_visual_compliance(
        poster_image_path=local_path,
        brand_logo_path=local_logo_path,
        brand_colors_hex=brand_colors,
        approved_slogan=slogan,
        restricted_terms=restricted_terms
    )

    audit_id = str(uuid.uuid4())
    record = {
        "id": audit_id,
        "uploaded_image_path": local_path,
        "brand_profile_id": brand_id,
        "logo_detected": audit_res["logo_detected"],
        "logo_match_score": audit_res["logo_match_score"],
        "logo_bbox": audit_res["logo_bbox"],
        "color_match_score": audit_res["color_match_score"],
        "text_match_result": audit_res["text_match_result"],
        "overall_visual_score": audit_res["overall_visual_score"],
        "status": audit_res["status"]
    }

    try:
        supabase.table("visual_compliance_audits").insert(record).execute()
    except Exception as e:
        print(f"[!] Warning on visual audit DB save: {e}")

    return {
        "id": audit_id,
        "uploaded_image_path": local_path,
        "signed_image_url": signed_url,
        "brand_profile_id": brand_id,
        "logo_detected": audit_res["logo_detected"],
        "logo_match_score": audit_res["logo_match_score"],
        "logo_bbox": audit_res["logo_bbox"],
        "color_match_score": audit_res["color_match_score"],
        "text_match_result": audit_res["text_match_result"],
        "overall_visual_score": audit_res["overall_visual_score"],
        "status": audit_res["status"],
        "created_at": datetime.now(timezone.utc)
    }


@router.get("/visual-compliance/audits/{audit_id}", response_model=VisualComplianceAuditResponse)
async def get_visual_compliance_audit(audit_id: str):
    """
    Retrieves the visual compliance audit result by audit_id.
    """
    supabase = get_supabase_admin()
    res = supabase.table("visual_compliance_audits").select("*").eq("id", audit_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Visual compliance audit not found.")

    rec = res.data[0]
    filename = os.path.basename(rec["uploaded_image_path"])
    signed_url = f"http://127.0.0.1:8000/static/uploads/{filename}"

    return {
        "id": rec["id"],
        "uploaded_image_path": rec["uploaded_image_path"],
        "signed_image_url": signed_url,
        "brand_profile_id": rec["brand_profile_id"],
        "logo_detected": rec["logo_detected"],
        "logo_match_score": rec["logo_match_score"],
        "logo_bbox": rec["logo_bbox"],
        "color_match_score": rec["color_match_score"],
        "text_match_result": rec["text_match_result"],
        "overall_visual_score": rec["overall_visual_score"],
        "status": rec["status"],
        "created_at": rec["created_at"]
    }
