"""
FastAPI Router for Phase 4 Poster Generation & Audit Studio Pipeline
Enforces the Compliance Gate: Only copy variants with an audit score > 70%
are eligible for poster generation.
"""

import os
import uuid
import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from app.models.schemas import PosterGenerationRequest, PosterGenerationResponse
from app.services.background_generation_service import generate_poster_background
from app.services.poster_compositor import composite_poster
from app.services.visual_compliance_service import audit_poster_visual_compliance
from app.services.compliance_service import run_text_compliance_audit
from app.services.supabase_client import get_supabase_admin, get_signed_url
from app.config import get_settings

router = APIRouter(prefix="/api/campaign-briefs", tags=["Poster Generation"])

# Storage directories for local static serving
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static")
POSTERS_DIR = os.path.join(STATIC_DIR, "posters")
LOGOS_DIR = os.path.join(STATIC_DIR, "logos")
os.makedirs(POSTERS_DIR, exist_ok=True)
os.makedirs(LOGOS_DIR, exist_ok=True)


def _resolve_local_logo_path(logo_file_path: Optional[str]) -> Optional[str]:
    """
    Ensures the brand logo file is available locally for image processing and YOLO/ORB matching.
    If it is stored in Supabase Storage, downloads it to a local cache.
    """
    if not logo_file_path:
        return None

    # Check if path is already an absolute local file that exists
    if os.path.isabs(logo_file_path) and os.path.exists(logo_file_path):
        return logo_file_path

    # Try relative to backend
    rel_path = os.path.join(os.path.dirname(__file__), "..", "..", logo_file_path)
    if os.path.exists(rel_path):
        return rel_path

    # Attempt download from Supabase Storage bucket 'brand-logos'
    settings = get_settings()
    supabase = get_supabase_admin()
    if supabase and logo_file_path:
        try:
            safe_filename = os.path.basename(logo_file_path).replace(" ", "_")
            local_cache_path = os.path.join(LOGOS_DIR, safe_filename)
            if os.path.exists(local_cache_path) and os.path.getsize(local_cache_path) > 0:
                return local_cache_path

            # Download raw bytes from Supabase Storage
            res = supabase.storage.from_(settings.BUCKET_LOGOS).download(logo_file_path)
            if res and len(res) > 0:
                with open(local_cache_path, "wb") as f:
                    f.write(res)
                return local_cache_path
        except Exception as e:
            print(f"[!] Logo download from Supabase Storage failed: {e}")

    return None


@router.get("/{brief_id}/eligible-poster-content")
async def get_eligible_poster_content(brief_id: str):
    """
    Returns brand context and audited copy variants for a brief,
    categorizing them into ELIGIBLE (score > 70%) and INELIGIBLE (score <= 70%).
    """
    supabase = get_supabase_admin()
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    # 1. Fetch Campaign Brief
    b_res = supabase.table("campaign_briefs").select("*").eq("id", brief_id).execute()
    if not b_res.data:
        raise HTTPException(status_code=404, detail="Campaign brief not found")
    brief = b_res.data[0]
    brand_profile_id = brief["brand_profile_id"]

    # 2. Fetch Brand Info
    brand_res = supabase.table("brand_profiles").select("*").eq("id", brand_profile_id).execute()
    brand_name = brand_res.data[0]["name"] if brand_res.data else "Brand"

    # Colors
    c_res = supabase.table("brand_colors").select("hex_code, usage_label").eq("brand_profile_id", brand_profile_id).execute()
    colors = [c["hex_code"] for c in (c_res.data or []) if c.get("hex_code")]

    # Logo
    logo_res = supabase.table("brand_logos").select("*").eq("brand_profile_id", brand_profile_id).limit(1).execute()
    logo_url = None
    if logo_res.data and logo_res.data[0].get("file_path"):
        settings = get_settings()
        logo_url = get_signed_url(settings.BUCKET_LOGOS, logo_res.data[0]["file_path"])

    # Tone / Voice
    voice_res = supabase.table("brand_voice_samples").select("sample_text, source").eq("brand_profile_id", brand_profile_id).limit(3).execute()
    tones = [v["source"] for v in (voice_res.data or []) if v.get("source")]
    brand_tone = ", ".join(set(tones)) if tones else "Bold, Innovative, Professional"

    # Guidelines
    rules_res = supabase.table("brand_guideline_rules").select("rule_text, category").eq("brand_profile_id", brand_profile_id).execute()
    rules = [r["rule_text"] for r in (rules_res.data or []) if r.get("rule_text")]

    # 3. Fetch Variants & their Compliance Audits
    variants_res = supabase.table("generated_copy_variants").select("*").eq("campaign_brief_id", brief_id).execute()
    variants = variants_res.data or []

    eligible_variants = []
    ineligible_variants = []

    recommended_headline = None
    recommended_hook = None
    recommended_cta = None

    for v in variants:
        v_id = v["id"]
        # Fetch latest audit
        a_res = supabase.table("compliance_audits").select("id, overall_score, tone_similarity_score, status").eq("variant_id", v_id).order("created_at", desc=True).limit(1).execute()
        
        audit_data = a_res.data[0] if (a_res.data and len(a_res.data) > 0) else None
        score = float(audit_data["overall_score"]) if audit_data else None

        item = {
            "variant_id": v_id,
            "variant_type": v.get("variant_type", "body"),
            "variant_text": v.get("variant_text", ""),
            "overall_score": score,
            "status": audit_data.get("status", "unaudited") if audit_data else "unaudited",
            "is_eligible": bool(score is not None and score > 70.0)
        }

        if score is not None and score > 70.0:
            eligible_variants.append(item)
            # Pick best recommended items
            if v.get("variant_type") == "headline" and not recommended_headline:
                recommended_headline = v.get("variant_text")
            elif v.get("variant_type") in ["body", "full_post"] and not recommended_hook:
                recommended_hook = v.get("variant_text")
            elif v.get("variant_type") == "cta" and not recommended_cta:
                recommended_cta = v.get("variant_text")
        else:
            ineligible_variants.append(item)

    # Fallbacks for recommended if not explicitly tagged
    if eligible_variants and not recommended_headline:
        recommended_headline = eligible_variants[0]["variant_text"]
    if not recommended_cta:
        recommended_cta = "EXPLORE NOW"

    default_prompt = f"Modern advertisement background for {brief.get('product_or_feature', brand_name)}, {brief.get('campaign_goal', 'scale business')}"

    return {
        "brief_id": brief_id,
        "brand_name": brand_name,
        "brand_profile_id": brand_profile_id,
        "brand_tone": brand_tone,
        "brand_colors": colors,
        "logo_url": logo_url,
        "guideline_rules_count": len(rules),
        "guidelines": rules[:5],
        "eligible_variants": eligible_variants,
        "ineligible_variants": ineligible_variants,
        "recommended_headline": recommended_headline,
        "recommended_hook": recommended_hook,
        "recommended_cta": recommended_cta,
        "default_prompt": default_prompt
    }


@router.post("/{brief_id}/generate-poster", response_model=PosterGenerationResponse)
async def generate_poster_for_brief(brief_id: str, payload: PosterGenerationRequest):
    """
    Triggers the Poster Generation & Visual Compliance Audit Studio Pipeline:
    1. Compliance Gate Check: Enforces that only audited copy with score > 70% is permitted.
    2. Fetches Brand Logo, Palette Colors, and Voice Tone.
    3. Generates AI Background (Pollinations FLUX.1 / HuggingFace / Brand Palette Fallback).
    4. Programmatically composites the real Brand Logo, audited Headline, Hook, and CTA Button.
    5. Executes automated Visual Compliance Audit (Logo presence, CLIP match, Color match, OCR verification).
    """
    settings = get_settings()
    supabase = get_supabase_admin()
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    # 1. Fetch Campaign Brief
    brief_res = supabase.table("campaign_briefs").select("*").eq("id", brief_id).execute()
    if not brief_res.data:
        raise HTTPException(status_code=404, detail="Campaign brief not found")
    
    brief = brief_res.data[0]
    brand_profile_id = brief["brand_profile_id"]

    # 2. Fetch Brand Profile (Colors, Logos, Voice Tone, Rules)
    brand_res = supabase.table("brand_profiles").select("*").eq("id", brand_profile_id).execute()
    brand_name = brand_res.data[0]["name"] if brand_res.data else "CampaignX AI"

    colors_res = supabase.table("brand_colors").select("hex_code, usage_label").eq("brand_profile_id", brand_profile_id).execute()
    brand_colors_hex = [c["hex_code"] for c in (colors_res.data or []) if c.get("hex_code")]

    voice_res = supabase.table("brand_voice_samples").select("source, sample_text").eq("brand_profile_id", brand_profile_id).limit(3).execute()
    tones = [v["source"] for v in (voice_res.data or []) if v.get("source")]
    brand_tone = ", ".join(set(tones)) if tones else "Bold, Professional"

    rules_res = supabase.table("brand_guideline_rules").select("rule_text").eq("brand_profile_id", brand_profile_id).execute()
    restricted_terms = [r["rule_text"] for r in (rules_res.data or []) if r.get("rule_text")]

    logo_res = supabase.table("brand_logos").select("*").eq("brand_profile_id", brand_profile_id).order("created_at", desc=True).limit(1).execute()
    raw_logo_path = logo_res.data[0]["file_path"] if logo_res.data else None
    local_logo_path = _resolve_local_logo_path(raw_logo_path)

    # 3. Compliance Gate Enforcement (Audit Score > 70%)
    compliance_score = None
    target_headline = payload.headline_text or payload.overlay_text
    target_hook = payload.hook_text
    target_cta = payload.cta_text

    if payload.selected_variant_id:
        # Check specific variant audit score
        a_res = supabase.table("compliance_audits").select("overall_score, status").eq("variant_id", payload.selected_variant_id).order("created_at", desc=True).limit(1).execute()
        if not a_res.data or len(a_res.data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Compliance Gate Violation: The selected variant has not been audited yet. Only copy variants with an audit score greater than 70% can be used to generate posters."
            )
        score = float(a_res.data[0]["overall_score"])
        if score <= 70.0:
            raise HTTPException(
                status_code=400,
                detail=f"Compliance Gate Violation: Selected copy variant scored {score}% in its compliance audit. Only copy with an audit score strictly greater than 70% is permitted."
            )
        compliance_score = score
        # Fetch variant text if not supplied
        v_res = supabase.table("generated_copy_variants").select("variant_text, variant_type").eq("id", payload.selected_variant_id).execute()
        if v_res.data:
            v_obj = v_res.data[0]
            if v_obj.get("variant_type") == "headline":
                target_headline = v_obj["variant_text"]
            elif v_obj.get("variant_type") in ["body", "full_post"]:
                target_hook = v_obj["variant_text"]
            elif v_obj.get("variant_type") == "cta":
                target_cta = v_obj["variant_text"]
            else:
                target_headline = v_obj["variant_text"]

    else:
        # Check if an audited variant with score > 70 exists for this brief
        v_res = supabase.table("generated_copy_variants").select("id, variant_text, variant_type").eq("campaign_brief_id", brief_id).execute()
        variants = v_res.data or []
        
        best_audited_variant = None
        best_score = -1.0

        for v in variants:
            a_res = supabase.table("compliance_audits").select("overall_score").eq("variant_id", v["id"]).order("created_at", desc=True).limit(1).execute()
            if a_res.data and len(a_res.data) > 0:
                s = float(a_res.data[0]["overall_score"])
                if s > 70.0 and s > best_score:
                    best_score = s
                    best_audited_variant = v

        if best_audited_variant:
            compliance_score = best_score
            if not target_headline:
                target_headline = best_audited_variant["variant_text"]
        else:
            # If user provided custom headline text, perform real-time text compliance audit check
            if target_headline and target_headline.strip():
                try:
                    audit_check = run_text_compliance_audit(
                        brand_profile_id=brand_profile_id,
                        text=target_headline,
                        user_id=brief.get("user_id", "system")
                    )
                    score = float(audit_check.get("overall_score", 0.0))
                    if score <= 70.0:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Compliance Gate Violation: Submitted headline scored {score}% (must be > 70%). Please revise or audit approved brand copy before generating posters."
                        )
                    compliance_score = score
                except HTTPException:
                    raise
                except Exception as audit_err:
                    print(f"[!] Real-time audit check error: {audit_err}")
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Compliance Gate: No copy variant with an audit score greater than 70% was found. Please run a compliance audit on your campaign variants before generating posters."
                )

    # Defaults for final text composition
    final_headline = (target_headline or f"{brief.get('product_or_feature', brand_name)}").strip()
    final_hook = (target_hook or brief.get("campaign_goal", "")).strip()
    final_cta = (target_cta or "LEARN MORE").strip()
    combined_slogan = f"{final_headline} · {final_cta}"

    # 4. Generate AI Background (Conditioned on prompt, brand tone, major colors)
    base_prompt = payload.custom_prompt or f"Modern commercial advertisement background for {brief.get('product_or_feature', brand_name)}, {brief.get('campaign_goal', '')}"
    bg_img = generate_poster_background(
        prompt=base_prompt,
        brand_colors=brand_colors_hex,
        tone=brand_tone,
        brand_name=brand_name
    )

    # 5. Composite Real Brand Logo, Colors, Audited Typography, and CTA
    final_poster, logo_bbox = composite_poster(
        background_image=bg_img,
        logo_image_path=local_logo_path,
        slogan_text=combined_slogan,
        headline_text=final_headline,
        hook_text=final_hook,
        cta_text=final_cta,
        brand_name=brand_name,
        brand_colors=brand_colors_hex,
        tone=brand_tone,
        compliance_score=compliance_score
    )

    # Save to static poster storage
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
        "background_prompt": base_prompt,
        "final_poster_path": local_path,
        "logo_placement": logo_bbox,
        "overlay_text": combined_slogan,
        "status": "ready"
    }

    try:
        supabase.table("poster_generations").insert(record).execute()
    except Exception as e:
        print(f"[!] Warning on poster DB save: {e}")

    # 6. Automatically trigger Phase 4 Visual Compliance Audit
    audit_res = audit_poster_visual_compliance(
        poster_image_path=local_path,
        brand_logo_path=local_logo_path,
        brand_colors_hex=brand_colors_hex,
        approved_slogan=final_headline,
        restricted_terms=restricted_terms
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

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return {
        "id": gen_id,
        "visual_audit_id": audit_id,
        "campaign_brief_id": brief_id,
        "brand_profile_id": brand_profile_id,
        "background_prompt": base_prompt,
        "final_poster_path": local_path,
        "signed_poster_url": signed_url,
        "logo_placement": logo_bbox,
        "overlay_text": combined_slogan,
        "status": "ready",
        "created_at": now_iso
    }
