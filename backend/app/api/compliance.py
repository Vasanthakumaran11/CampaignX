import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Header, status

from app.models.schemas import (
    ComplianceAuditRequest,
    ComplianceAuditResponse,
    ComplianceFlagResponse
)
from app.services.supabase_client import get_supabase_admin
from app.services.compliance_service import run_text_compliance_audit
from app.api.campaign_briefs import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Text Compliance Engine & Audit Studio"])


# 1. POST /api/brand-profiles/{brand_profile_id}/compliance/audit — Trigger Audit
@router.post("/api/brand-profiles/{brand_profile_id}/compliance/audit", response_model=ComplianceAuditResponse)
async def trigger_compliance_audit(
    brand_profile_id: str,
    payload: ComplianceAuditRequest,
    user_id: str = Depends(get_current_user_id)
):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    audit_text = ""
    target_variant_id = payload.variant_id

    if target_variant_id:
        # Load variant_text from DB
        v_res = client.table("generated_copy_variants").select("variant_text").eq("id", target_variant_id).execute()
        if not v_res.data or len(v_res.data) == 0:
            raise HTTPException(status_code=404, detail=f"Variant {target_variant_id} not found.")
        audit_text = v_res.data[0]["variant_text"]
    elif payload.text and payload.text.strip():
        audit_text = payload.text.strip()
    else:
        raise HTTPException(status_code=400, detail="Must provide either variant_id or text to audit.")

    try:
        result = run_text_compliance_audit(
            brand_profile_id=brand_profile_id,
            text=audit_text,
            user_id=user_id,
            variant_id=target_variant_id
        )
        return ComplianceAuditResponse(**result)
    except Exception as e:
        logger.error(f"Error running compliance audit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 2. GET /api/compliance/audits/{audit_id} — Fetch Audit Details with Flags
@router.get("/api/compliance/audits/{audit_id}", response_model=ComplianceAuditResponse)
async def get_compliance_audit_details(audit_id: str):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        a_res = client.table("compliance_audits").select("*").eq("id", audit_id).execute()
        if not a_res.data or len(a_res.data) == 0:
            raise HTTPException(status_code=404, detail="Compliance audit not found.")

        audit_data = a_res.data[0]
        f_res = client.table("compliance_flags").select("*").eq("audit_id", audit_id).execute()
        audit_data["flags"] = [ComplianceFlagResponse(**f) for f in (f_res.data or [])]

        return ComplianceAuditResponse(**audit_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching compliance audit {audit_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 3. GET /api/brand-profiles/{brand_profile_id}/compliance/audits — List Audits for Brand Profile
@router.get("/api/brand-profiles/{brand_profile_id}/compliance/audits", response_model=List[ComplianceAuditResponse])
async def list_brand_compliance_audits(brand_profile_id: str):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        a_res = client.table("compliance_audits").select("*").eq("brand_profile_id", brand_profile_id).order("created_at", desc=True).execute()
        audits = a_res.data or []

        results = []
        for a in audits:
            f_res = client.table("compliance_flags").select("*").eq("audit_id", a["id"]).execute()
            a["flags"] = [ComplianceFlagResponse(**f) for f in (f_res.data or [])]
            results.append(ComplianceAuditResponse(**a))

        return results
    except Exception as e:
        logger.error(f"Error listing compliance audits for brand {brand_profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 4. GET /api/campaign-briefs/{brief_id}/variants/{variant_id}/compliance — Latest Audit for Variant
@router.get("/api/campaign-briefs/{brief_id}/variants/{variant_id}/compliance", response_model=Optional[ComplianceAuditResponse])
async def get_variant_latest_compliance(brief_id: str, variant_id: str):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        a_res = client.table("compliance_audits").select("*").eq("variant_id", variant_id).order("created_at", desc=True).limit(1).execute()
        if not a_res.data or len(a_res.data) == 0:
            return None

        audit_data = a_res.data[0]
        f_res = client.table("compliance_flags").select("*").eq("audit_id", audit_data["id"]).execute()
        audit_data["flags"] = [ComplianceFlagResponse(**f) for f in (f_res.data or [])]

        return ComplianceAuditResponse(**audit_data)
    except Exception as e:
        logger.error(f"Error fetching latest compliance for variant {variant_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
