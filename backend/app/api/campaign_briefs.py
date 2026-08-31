import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Header, status
from pydantic import BaseModel

from app.models.schemas import (
    CampaignBriefCreate,
    CampaignBriefResponse,
    GeneratedCopyVariantResponse,
    GeneratedCopyVariantUpdate
)
from app.services.supabase_client import get_supabase_admin
from app.services.retrieval_service import retrieve_grounding_context
from app.services.generation_service import generate_copy_variants, revise_variant
from pydantic import BaseModel as PydanticBase
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/campaign-briefs", tags=["Campaign Briefs & Copy Generation"])


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Resolves active user_id from Bearer JWT token or resolves the first active user from auth.users.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            user_res = client.auth.get_user(token)
            if user_res and user_res.user:
                return user_res.user.id
        except Exception as e:
            logger.warning(f"Could not verify user token: {e}")

    # Fallback to dev user ID
    try:
        profiles = client.table("brand_profiles").select("user_id").limit(1).execute()
        if profiles.data and len(profiles.data) > 0:
            return profiles.data[0]["user_id"]
    except Exception:
        pass

    # Generic dev fallback UUID
    return "00000000-0000-0000-0000-000000000000"


# 1. POST /api/campaign-briefs — Create new campaign brief
@router.post("", response_model=CampaignBriefResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign_brief(
    payload: CampaignBriefCreate,
    user_id: str = Depends(get_current_user_id)
):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    # Verify brand profile exists
    profile_check = client.table("brand_profiles").select("id").eq("id", payload.brand_profile_id).execute()
    if not profile_check.data:
        raise HTTPException(status_code=404, detail=f"Brand profile {payload.brand_profile_id} not found.")

    try:
        insert_data = {
            "brand_profile_id": payload.brand_profile_id,
            "user_id": user_id,
            "campaign_goal": payload.campaign_goal.strip(),
            "target_audience": payload.target_audience.strip(),
            "channel": payload.channel.lower(),
            "product_or_feature": payload.product_or_feature.strip(),
            "additional_context": payload.additional_context.strip() if payload.additional_context else None
        }

        res = client.table("campaign_briefs").insert(insert_data).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create campaign brief.")

        created = res.data[0]
        return CampaignBriefResponse(**created)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating campaign brief: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 2. GET /api/campaign-briefs/{id} — Fetch brief details
@router.get("/{id}", response_model=CampaignBriefResponse)
async def get_campaign_brief(id: str):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        res = client.table("campaign_briefs").select("*").eq("id", id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Campaign brief not found.")

        return CampaignBriefResponse(**res.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching campaign brief {id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 3. GET /api/campaign-briefs/by-brand/{brand_profile_id} — List briefs for brand
@router.get("/by-brand/{brand_profile_id}", response_model=List[CampaignBriefResponse])
async def list_campaign_briefs_by_brand(brand_profile_id: str):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        res = client.table("campaign_briefs").select("*").eq("brand_profile_id", brand_profile_id).order("created_at", desc=True).execute()
        return [CampaignBriefResponse(**row) for row in (res.data or [])]
    except Exception as e:
        logger.error(f"Error listing campaign briefs for brand {brand_profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 4. POST /api/campaign-briefs/{id}/generate — Core RAG Generation Trigger
@router.post("/{id}/generate", response_model=List[GeneratedCopyVariantResponse])
async def generate_variants_for_brief(id: str):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    # 1. Load brief
    brief_res = client.table("campaign_briefs").select("*").eq("id", id).execute()
    if not brief_res.data or len(brief_res.data) == 0:
        raise HTTPException(status_code=404, detail="Campaign brief not found.")

    brief = brief_res.data[0]

    # 2. RAG Retrieval Step (top-5 voice anchors + restricted rules)
    query_string = f"{brief['campaign_goal']} {brief['target_audience']} {brief['product_or_feature']}"
    retrieved_context = retrieve_grounding_context(
        brand_profile_id=brief["brand_profile_id"],
        query_text=query_string,
        top_k=5
    )

    # 3. LLM Generation Step
    try:
        raw_variants = generate_copy_variants(
            brief=brief,
            retrieved_context=retrieved_context,
            generation_index=1
        )
    except Exception as e:
        logger.error(f"Generation error for brief {id}: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    if not raw_variants:
        raise HTTPException(status_code=500, detail="Generation completed but produced no variants.")

    # 4. Save generated variants to database
    to_insert = []
    for v in raw_variants:
        to_insert.append({
            "campaign_brief_id": id,
            "variant_text": v["variant_text"],
            "variant_type": v["variant_type"],
            "generation_index": 1,
            "grounding_voice_sample_ids": v.get("grounding_voice_sample_ids", []),
            "status": "generated"
        })

    try:
        ins_res = client.table("generated_copy_variants").insert(to_insert).execute()
        created_rows = ins_res.data or []
        return [GeneratedCopyVariantResponse(**row) for row in created_rows]
    except Exception as e:
        logger.error(f"Error saving generated variants to DB: {e}")
        raise HTTPException(status_code=500, detail=f"Error storing variants: {str(e)}")


# 5. POST /api/campaign-briefs/{id}/regenerate — Append new batch of variants
@router.post("/{id}/regenerate", response_model=List[GeneratedCopyVariantResponse])
async def regenerate_variants_for_brief(id: str):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    brief_res = client.table("campaign_briefs").select("*").eq("id", id).execute()
    if not brief_res.data or len(brief_res.data) == 0:
        raise HTTPException(status_code=404, detail="Campaign brief not found.")

    brief = brief_res.data[0]

    # Find highest generation_index currently existing for brief
    existing_res = client.table("generated_copy_variants").select("generation_index").eq("campaign_brief_id", id).order("generation_index", desc=True).limit(1).execute()
    next_index = 2
    if existing_res.data and len(existing_res.data) > 0:
        next_index = existing_res.data[0].get("generation_index", 1) + 1

    query_string = f"{brief['campaign_goal']} {brief['target_audience']} {brief['product_or_feature']}"
    retrieved_context = retrieve_grounding_context(
        brand_profile_id=brief["brand_profile_id"],
        query_text=query_string,
        top_k=5
    )

    raw_variants = generate_copy_variants(
        brief=brief,
        retrieved_context=retrieved_context,
        generation_index=next_index
    )

    to_insert = []
    for v in raw_variants:
        to_insert.append({
            "campaign_brief_id": id,
            "variant_text": v["variant_text"],
            "variant_type": v["variant_type"],
            "generation_index": next_index,
            "grounding_voice_sample_ids": v.get("grounding_voice_sample_ids", []),
            "status": "generated"
        })

    try:
        ins_res = client.table("generated_copy_variants").insert(to_insert).execute()
        return [GeneratedCopyVariantResponse(**row) for row in (ins_res.data or [])]
    except Exception as e:
        logger.error(f"Error storing regenerated variants: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 6. GET /api/campaign-briefs/{id}/variants — List all variants for a brief
@router.get("/{id}/variants", response_model=List[GeneratedCopyVariantResponse])
async def list_variants_for_brief(id: str):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        res = client.table("generated_copy_variants").select("*").eq("campaign_brief_id", id).order("created_at", desc=True).execute()
        return [GeneratedCopyVariantResponse(**row) for row in (res.data or [])]
    except Exception as e:
        logger.error(f"Error listing variants for brief {id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 7. PATCH /api/campaign-briefs/{id}/variants/{variant_id} — Update status or text
@router.patch("/{id}/variants/{variant_id}", response_model=GeneratedCopyVariantResponse)
async def update_variant(
    id: str,
    variant_id: str,
    payload: GeneratedCopyVariantUpdate
):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    update_data = {}
    if payload.status is not None:
        if payload.status.lower() not in ["generated", "saved", "discarded"]:
            raise HTTPException(status_code=400, detail="Invalid status value. Must be generated, saved, or discarded.")
        update_data["status"] = payload.status.lower()

    if payload.variant_text is not None and payload.variant_text.strip():
        update_data["variant_text"] = payload.variant_text.strip()

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    try:
        res = client.table("generated_copy_variants").update(update_data).eq("id", variant_id).eq("campaign_brief_id", id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Variant not found.")

        return GeneratedCopyVariantResponse(**res.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating variant {variant_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 8. DELETE /api/campaign-briefs/{id}/variants/{variant_id} — Delete variant
@router.delete("/{id}/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_variant(id: str, variant_id: str):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    try:
        client.table("generated_copy_variants").delete().eq("id", variant_id).eq("campaign_brief_id", id).execute()
        return None
    except Exception as e:
        logger.error(f"Error deleting variant {variant_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 9. POST /api/campaign-briefs/{id}/variants/{variant_id}/revise
# ============================================================================
class ReviseVariantRequest(PydanticBase):
    instruction: str

class ReviseVariantResponse(PydanticBase):
    original_text: str
    revised_text: str
    instruction: str
    variant_id: str

@router.post("/{id}/variants/{variant_id}/revise", response_model=ReviseVariantResponse)
async def revise_variant_copy(
    id: str,
    variant_id: str,
    payload: ReviseVariantRequest
):
    """POST /revise — Takes a variant + user instruction, returns brand-grounded revised copy."""
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    # Load the variant
    v_res = client.table("generated_copy_variants").select("*").eq("id", variant_id).eq("campaign_brief_id", id).execute()
    if not v_res.data:
        raise HTTPException(status_code=404, detail="Variant not found.")
    variant = v_res.data[0]
    original_text = variant["variant_text"]

    # Load the brief
    b_res = client.table("campaign_briefs").select("*").eq("id", id).execute()
    if not b_res.data:
        raise HTTPException(status_code=404, detail="Campaign brief not found.")
    brief = b_res.data[0]

    # RAG context
    query_string = f"{brief['campaign_goal']} {brief['target_audience']} {brief['product_or_feature']} {payload.instruction}"
    retrieved_context = retrieve_grounding_context(
        brand_profile_id=brief["brand_profile_id"],
        query_text=query_string,
        top_k=5
    )

    try:
        revised_text = revise_variant(
            original_text=original_text,
            revision_instruction=payload.instruction,
            brief=brief,
            retrieved_context=retrieved_context
        )
    except Exception as e:
        logger.error(f"Revision error for variant {variant_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Revision failed: {str(e)}")

    # Save the revised text back to the variant
    try:
        client.table("generated_copy_variants").update({"variant_text": revised_text, "status": "generated"}).eq("id", variant_id).execute()
    except Exception as e:
        logger.warning(f"Could not persist revised variant text: {e}")

    return ReviseVariantResponse(
        original_text=original_text,
        revised_text=revised_text,
        instruction=payload.instruction,
        variant_id=variant_id
    )


# ============================================================================
# 10. POST /api/campaign-briefs/{id}/variants/{variant_id}/approve
# ============================================================================
class ApproveVariantResponse(PydanticBase):
    variant_id: str
    status: str
    approved_at: str
    message: str

@router.post("/{id}/variants/{variant_id}/approve", response_model=ApproveVariantResponse)
async def approve_variant(
    id: str,
    variant_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Formally approve a copy variant — sets status to 'saved' with approval timestamp."""
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    v_res = client.table("generated_copy_variants").select("id").eq("id", variant_id).eq("campaign_brief_id", id).execute()
    if not v_res.data:
        raise HTTPException(status_code=404, detail="Variant not found.")

    approved_at = datetime.now(timezone.utc).isoformat()
    try:
        client.table("generated_copy_variants").update({"status": "saved"}).eq("id", variant_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Approval failed: {str(e)}")

    return ApproveVariantResponse(
        variant_id=variant_id,
        status="saved",
        approved_at=approved_at,
        message="Variant approved successfully and marked as human-approved."
    )
