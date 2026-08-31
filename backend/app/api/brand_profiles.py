import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Header
from app.models.schemas import (
    BrandProfileCreate,
    BrandProfileManualCreate,
    BrandProfileSummaryResponse,
    BrandProfileDetailResponse,
    BrandProfileStatusResponse,
    BrandColorUpdate,
    BrandColorResponse,
    BrandLogoUpdate,
    BrandLogoResponse,
    BrandGuidelineRuleUpdate,
    BrandGuidelineRuleResponse,
    BrandVoiceSampleResponse,
)
from app.services.supabase_client import (
    get_supabase_admin,
    get_signed_url,
    delete_file_from_storage
)
from app.services.embedding_service import embed
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/brand-profiles", tags=["Brand Profiles"])


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Extracts or verifies the user_id from the Supabase JWT Authorization header.
    In dev mode without JWT, retrieves or ensures an active auth user in Supabase.
    """
    client = get_supabase_admin()
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        if client:
            try:
                user_res = client.auth.get_user(token)
                if user_res and user_res.user:
                    return str(user_res.user.id)
            except Exception as e:
                logger.warning(f"Could not decode user token: {e}")

    # In dev mode, resolve the first valid auth user from Supabase
    if client:
        try:
            users_res = client.auth.admin.list_users()
            users = users_res if isinstance(users_res, list) else getattr(users_res, 'users', [])
            if users and len(users) > 0:
                return str(users[0].id)
            # If no users exist in auth.users yet, create the default dev user
            new_u = client.auth.admin.create_user({
                "email": "dev_admin@campaignx.local",
                "password": "CampaignXDev123!",
                "email_confirm": True
            })
            return str(new_u.user.id)
        except Exception as err:
            logger.warning(f"Could not resolve dev user from auth admin: {err}")

    return "00000000-0000-0000-0000-000000000001"


@router.post("", response_model=BrandProfileStatusResponse, status_code=status.HTTP_201_CREATED)
async def create_brand_profile(
    payload: BrandProfileCreate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new brand profile with name and initial status 'processing'.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase database is not configured. Please check backend/.env."
        )

    target_user_id = payload.user_id if payload.user_id else user_id

    try:
        res = client.table("brand_profiles").insert({
            "name": payload.name.strip(),
            "user_id": target_user_id,
            "status": "processing"
        }).execute()

        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to insert brand profile.")

        record = res.data[0]
        return BrandProfileStatusResponse(
            id=record["id"],
            status=record["status"],
            name=record["name"],
            raw_guideline_file_path=record.get("raw_guideline_file_path"),
            updated_at=record.get("updated_at")
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating brand profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{profile_id}/manual-entry", response_model=BrandProfileStatusResponse)
async def create_brand_profile_manual_entry(
    profile_id: str,
    payload: BrandProfileManualCreate,
):
    """
    Persist a brand profile created without a guideline PDF. This path requires a logo,
    at least one color, a tone summary, at least two voice samples, and at least one rule.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    prof_res = client.table("brand_profiles").select("id, name").eq("id", profile_id).execute()
    if not prof_res.data or len(prof_res.data) == 0:
        raise HTTPException(status_code=404, detail="Brand profile not found.")

    logo_res = client.table("brand_logos").select("id").eq("brand_profile_id", profile_id).execute()
    if not logo_res.data or len(logo_res.data) == 0:
        raise HTTPException(status_code=400, detail="A logo is required before a manual brand profile can be saved.")

    try:
        for color in payload.brand_colors:
            client.table("brand_colors").insert({
                "brand_profile_id": profile_id,
                "hex_code": color.hex_code.strip(),
                "usage_label": (color.usage_label or "primary").lower() if color.usage_label else "primary",
                "source": "sample_asset",
                "frequency_rank": 1,
            }).execute()

        for sample in payload.voice_samples:
            clean_text = sample.strip()
            if clean_text:
                emb = embed(clean_text)
                client.table("brand_voice_samples").insert({
                    "brand_profile_id": profile_id,
                    "sample_text": clean_text,
                    "embedding": emb,
                    "source": "user_uploaded",
                }).execute()

        tone_rule = payload.tone.strip()
        if tone_rule:
            client.table("brand_guideline_rules").insert({
                "brand_profile_id": profile_id,
                "rule_text": tone_rule,
                "category": "tone",
                "page_number": None,
            }).execute()

        for rule in payload.restricted_rules:
            clean_rule = rule.rule_text.strip()
            if clean_rule:
                client.table("brand_guideline_rules").insert({
                    "brand_profile_id": profile_id,
                    "rule_text": clean_rule,
                    "category": rule.category or "restricted_terms",
                    "page_number": None,
                }).execute()

        client.table("brand_profiles").update({"status": "ready"}).eq("id", profile_id).execute()

        return BrandProfileStatusResponse(
            id=profile_id,
            status="ready",
            name=prof_res.data[0].get("name"),
            raw_guideline_file_path=prof_res.data[0].get("raw_guideline_file_path"),
            updated_at=prof_res.data[0].get("updated_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving manual brand entry for {profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[BrandProfileSummaryResponse])
async def list_brand_profiles():
    """
    List all brand profiles with counts.
    """
    client = get_supabase_admin()
    if not client:
        return []

    try:
        res = client.table("brand_profiles").select("*, brand_colors(count), brand_logos(count), brand_guideline_rules(count), brand_voice_samples(count)").order("created_at", desc=True).execute()
        
        profiles = []
        for row in (res.data or []):
            color_cnt = row.get("brand_colors", [{}])[0].get("count", 0) if isinstance(row.get("brand_colors"), list) and row.get("brand_colors") else 0
            logo_cnt = row.get("brand_logos", [{}])[0].get("count", 0) if isinstance(row.get("brand_logos"), list) and row.get("brand_logos") else 0
            rule_cnt = row.get("brand_guideline_rules", [{}])[0].get("count", 0) if isinstance(row.get("brand_guideline_rules"), list) and row.get("brand_guideline_rules") else 0
            sample_cnt = row.get("brand_voice_samples", [{}])[0].get("count", 0) if isinstance(row.get("brand_voice_samples"), list) and row.get("brand_voice_samples") else 0

            profiles.append(BrandProfileSummaryResponse(
                id=row["id"],
                user_id=row["user_id"],
                name=row["name"],
                status=row["status"],
                raw_guideline_file_path=row.get("raw_guideline_file_path"),
                color_count=color_cnt,
                logo_count=logo_cnt,
                rule_count=rule_cnt,
                sample_count=sample_cnt,
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            ))
        return profiles
    except Exception as e:
        logger.error(f"Error listing brand profiles: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{profile_id}/status", response_model=BrandProfileStatusResponse)
async def get_brand_profile_status(profile_id: str):
    """
    Lightweight polling endpoint returning the status of a brand profile.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        res = client.table("brand_profiles").select("id, name, status, raw_guideline_file_path, updated_at").eq("id", profile_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Brand profile not found.")

        row = res.data[0]
        return BrandProfileStatusResponse(
            id=row["id"],
            status=row["status"],
            name=row["name"],
            raw_guideline_file_path=row.get("raw_guideline_file_path"),
            updated_at=row.get("updated_at")
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching status for profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{profile_id}", response_model=BrandProfileDetailResponse)
async def get_brand_profile_detail(profile_id: str):
    """
    Returns full profile including nested colors, logos (with signed URLs), voice samples, rules.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    settings = get_settings()

    try:
        # Fetch profile
        prof_res = client.table("brand_profiles").select("*").eq("id", profile_id).execute()
        if not prof_res.data or len(prof_res.data) == 0:
            raise HTTPException(status_code=404, detail="Brand profile not found.")

        prof = prof_res.data[0]

        # Signed URL for guideline PDF
        signed_pdf_url = None
        if prof.get("raw_guideline_file_path"):
            signed_pdf_url = get_signed_url(settings.BUCKET_GUIDELINES, prof["raw_guideline_file_path"])

        # Colors
        colors_res = client.table("brand_colors").select("*").eq("brand_profile_id", profile_id).order("frequency_rank").execute()
        colors = [
            BrandColorResponse(
                id=c["id"],
                brand_profile_id=c["brand_profile_id"],
                hex_code=c["hex_code"],
                usage_label=c.get("usage_label"),
                source=c.get("source", "guideline_pdf"),
                frequency_rank=c.get("frequency_rank", 1),
                created_at=c["created_at"],
                updated_at=c["updated_at"]
            )
            for c in (colors_res.data or [])
        ]

        # Logos
        logos_res = client.table("brand_logos").select("*").eq("brand_profile_id", profile_id).execute()
        logos = []
        for l in (logos_res.data or []):
            signed_logo_url = get_signed_url(settings.BUCKET_LOGOS, l["file_path"]) if l.get("file_path") else None
            logos.append(BrandLogoResponse(
                id=l["id"],
                brand_profile_id=l["brand_profile_id"],
                file_path=l["file_path"],
                signed_url=signed_logo_url,
                variant_label=l.get("variant_label"),
                min_clear_space_note=l.get("min_clear_space_note"),
                created_at=l["created_at"],
                updated_at=l["updated_at"]
            ))

        # Voice Samples
        samples_res = client.table("brand_voice_samples").select("id, brand_profile_id, sample_text, source, created_at, updated_at, embedding").eq("brand_profile_id", profile_id).execute()
        voice_samples = [
            BrandVoiceSampleResponse(
                id=s["id"],
                brand_profile_id=s["brand_profile_id"],
                sample_text=s["sample_text"],
                source=s.get("source", "guideline_pdf"),
                has_embedding=s.get("embedding") is not None,
                embedding_dimension=384 if s.get("embedding") else None,
                created_at=s["created_at"],
                updated_at=s["updated_at"]
            )
            for s in (samples_res.data or [])
        ]

        # Rules
        rules_res = client.table("brand_guideline_rules").select("*").eq("brand_profile_id", profile_id).order("page_number", nullsfirst=False).execute()
        rules = [
            BrandGuidelineRuleResponse(
                id=r["id"],
                brand_profile_id=r["brand_profile_id"],
                rule_text=r["rule_text"],
                category=r.get("category", "uncategorized"),
                page_number=r.get("page_number"),
                created_at=r["created_at"],
                updated_at=r["updated_at"]
            )
            for r in (rules_res.data or [])
        ]

        return BrandProfileDetailResponse(
            id=prof["id"],
            user_id=prof["user_id"],
            name=prof["name"],
            status=prof["status"],
            raw_guideline_file_path=prof.get("raw_guideline_file_path"),
            signed_guideline_url=signed_pdf_url,
            colors=colors,
            logos=logos,
            voice_samples=voice_samples,
            rules=rules,
            created_at=prof["created_at"],
            updated_at=prof["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile details for {profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{profile_id}/colors/{color_id}", response_model=BrandColorResponse)
async def update_brand_color_label(
    profile_id: str,
    color_id: str,
    payload: BrandColorUpdate
):
    """
    Correct or label a brand color's usage_label (primary/secondary/accent/background/text/other).
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        res = client.table("brand_colors").update({
            "usage_label": payload.usage_label
        }).eq("id", color_id).eq("brand_profile_id", profile_id).execute()

        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Color record not found.")

        updated = res.data[0]
        return BrandColorResponse(
            id=updated["id"],
            brand_profile_id=updated["brand_profile_id"],
            hex_code=updated["hex_code"],
            usage_label=updated.get("usage_label"),
            source=updated.get("source", "guideline_pdf"),
            frequency_rank=updated.get("frequency_rank", 1),
            created_at=updated["created_at"],
            updated_at=updated["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating color {color_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{profile_id}/logos/{logo_id}", response_model=BrandLogoResponse)
async def update_brand_logo_label(
    profile_id: str,
    logo_id: str,
    payload: BrandLogoUpdate
):
    """
    Label a logo variant (e.g. primary, icon-only, monochrome, secondary).
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    settings = get_settings()

    try:
        res = client.table("brand_logos").update({
            "variant_label": payload.variant_label
        }).eq("id", logo_id).eq("brand_profile_id", profile_id).execute()

        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Logo record not found.")

        updated = res.data[0]
        signed_url = get_signed_url(settings.BUCKET_LOGOS, updated["file_path"]) if updated.get("file_path") else None
        return BrandLogoResponse(
            id=updated["id"],
            brand_profile_id=updated["brand_profile_id"],
            file_path=updated["file_path"],
            signed_url=signed_url,
            variant_label=updated.get("variant_label"),
            min_clear_space_note=updated.get("min_clear_space_note"),
            created_at=updated["created_at"],
            updated_at=updated["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating logo {logo_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{profile_id}/rules/{rule_id}", response_model=BrandGuidelineRuleResponse)
async def update_brand_rule(
    profile_id: str,
    rule_id: str,
    payload: BrandGuidelineRuleUpdate
):
    """
    Update an extracted rule statement text or reclassify its category.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    update_data = {}
    if payload.category is not None:
        update_data["category"] = payload.category
    if payload.rule_text is not None and payload.rule_text.strip():
        update_data["rule_text"] = payload.rule_text.strip()

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    try:
        res = client.table("brand_guideline_rules").update(update_data).eq("id", rule_id).eq("brand_profile_id", profile_id).execute()

        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Rule record not found.")

        updated = res.data[0]
        return BrandGuidelineRuleResponse(
            id=updated["id"],
            brand_profile_id=updated["brand_profile_id"],
            rule_text=updated["rule_text"],
            category=updated.get("category", "uncategorized"),
            page_number=updated.get("page_number"),
            created_at=updated["created_at"],
            updated_at=updated["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{profile_id}/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand_rule(profile_id: str, rule_id: str):
    """
    Delete an individual extracted rule statement.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        client.table("brand_guideline_rules").delete().eq("id", rule_id).eq("brand_profile_id", profile_id).execute()
        return None
    except Exception as e:
        logger.error(f"Error deleting rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{profile_id}/voice-samples/{sample_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand_voice_sample(profile_id: str, sample_id: str):
    """
    Delete an individual voice sample anchor.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        client.table("brand_voice_samples").delete().eq("id", sample_id).eq("brand_profile_id", profile_id).execute()
        return None
    except Exception as e:
        logger.error(f"Error deleting voice sample {sample_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand_profile(profile_id: str):
    """
    Cascade delete brand profile, child records, and associated files in Supabase Storage.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    settings = get_settings()

    try:
        # 1. Fetch logos to delete from storage
        logos_res = client.table("brand_logos").select("file_path").eq("brand_profile_id", profile_id).execute()
        for l in (logos_res.data or []):
            if l.get("file_path"):
                delete_file_from_storage(settings.BUCKET_LOGOS, l["file_path"])

        # 2. Fetch raw guideline to delete
        prof_res = client.table("brand_profiles").select("raw_guideline_file_path").eq("id", profile_id).execute()
        if prof_res.data and prof_res.data[0].get("raw_guideline_file_path"):
            delete_file_from_storage(settings.BUCKET_GUIDELINES, prof_res.data[0]["raw_guideline_file_path"])

        # 3. Delete brand profile row (Foreign keys ON DELETE CASCADE handles colors, logos, rules, voice samples)
        client.table("brand_profiles").delete().eq("id", profile_id).execute()
        return None
    except Exception as e:
        logger.error(f"Error deleting brand profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
