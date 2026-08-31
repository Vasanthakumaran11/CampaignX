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
        brand_logo_path=brand_logo,
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
async def get_visual_audit_details(audit_id: str):
    """
    Fetches visual audit result details including bounding box coordinates.
    """
    supabase = get_supabase_admin()
    res = supabase.table("visual_compliance_audits").select("*").eq("id", audit_id).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Visual compliance audit record not found")

    item = res.data[0]
    return {
        "id": item["id"],
        "poster_generation_id": item.get("poster_generation_id"),
        "uploaded_image_path": item.get("uploaded_image_path"),
        "signed_image_url": f"http://127.0.0.1:8000/static/uploads/{os.path.basename(item.get('uploaded_image_path', ''))}" if item.get("uploaded_image_path") else None,
        "brand_profile_id": item["brand_profile_id"],
        "logo_detected": item.get("logo_detected", False),
        "logo_match_score": float(item.get("logo_match_score", 0.0)),
        "logo_bbox": item.get("logo_bbox"),
        "color_match_score": float(item.get("color_match_score", 0.0)),
        "text_match_result": item.get("text_match_result"),
        "overall_visual_score": float(item.get("overall_visual_score", 0.0)),
        "status": item.get("status", "pass"),
        "created_at": item.get("created_at", "2026-08-27T16:00:00Z")
    }
