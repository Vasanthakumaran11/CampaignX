"""
Pydantic Schemas for CampaignX Brand Profile Ingestion
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator


class BrandProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the brand profile")
    user_id: Optional[str] = Field(None, description="Supabase user ID")


class ManualBrandColorInput(BaseModel):
    hex_code: str = Field(..., min_length=4, max_length=9, description="Brand color hex such as #0F172A")
    usage_label: Optional[str] = Field(None, description="primary | secondary | accent | background | text | other")


class ManualBrandRuleInput(BaseModel):
    rule_text: str = Field(..., min_length=3, max_length=500, description="Restricted brand rule to enforce")
    category: Optional[str] = Field("restricted_terms", description="Category for rule classification")


class BrandProfileManualCreate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Name of the brand profile")
    brand_colors: List[ManualBrandColorInput] = Field(default_factory=list, description="Manual brand colors, at least one primary color recommended")
    tone: str = Field(..., min_length=3, max_length=500, description="Brand tone or voice summary")
    voice_samples: List[str] = Field(default_factory=list, min_length=2, description="At least two approved sample phrases")
    restricted_rules: List[ManualBrandRuleInput] = Field(default_factory=list, min_length=1, description="At least one restricted rule")
    logo_file_name: str = Field(..., min_length=1, max_length=255, description="Uploaded logo file name")
    logo_file_size_bytes: int = Field(..., gt=0, description="Uploaded logo file size in bytes")

    @model_validator(mode="after")
    def validate_manual_brand_profile(self):
        primary_colors = [c for c in self.brand_colors if (c.usage_label or "").lower() == "primary"]
        if not self.brand_colors:
            raise ValueError("At least one brand color is required for manual onboarding.")
        if not primary_colors:
            # Allow the UI to submit a default primary without a label; this keeps the manual path valid.
            if not any(c.hex_code for c in self.brand_colors):
                raise ValueError("At least one valid brand color is required.")
        if len(self.voice_samples) < 2:
            raise ValueError("At least two voice samples are required for manual onboarding.")
        if len(self.restricted_rules) < 1:
            raise ValueError("At least one restricted rule is required.")
        if not self.logo_file_name.strip():
            raise ValueError("A logo file is required before saving a manual brand profile.")
        if not self.tone.strip():
            raise ValueError("Brand tone is required.")
        return self


class BrandColorBase(BaseModel):
    hex_code: str
    usage_label: Optional[str] = None
    source: str = "guideline_pdf"
    frequency_rank: int = 1


class BrandColorUpdate(BaseModel):
    usage_label: Optional[str] = Field(
        None,
        description="Usage label e.g. primary, secondary, accent, background, text, other"
    )


class BrandColorResponse(BrandColorBase):
    id: str
    brand_profile_id: str
    created_at: datetime
    updated_at: datetime


class BrandLogoBase(BaseModel):
    file_path: str
    variant_label: Optional[str] = None
    min_clear_space_note: Optional[str] = None


class BrandLogoUpdate(BaseModel):
    variant_label: Optional[str] = Field(
        None,
        description="Variant label e.g. primary, icon-only, monochrome, secondary"
    )


class BrandLogoResponse(BrandLogoBase):
    id: str
    brand_profile_id: str
    signed_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class BrandVoiceSampleBase(BaseModel):
    sample_text: str
    source: str = "guideline_pdf"


class BrandVoiceSampleResponse(BrandVoiceSampleBase):
    id: str
    brand_profile_id: str
    has_embedding: bool = False
    embedding_dimension: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class BrandGuidelineRuleBase(BaseModel):
    rule_text: str
    category: Optional[str] = "uncategorized"
    page_number: Optional[int] = None


class BrandGuidelineRuleUpdate(BaseModel):
    category: Optional[str] = Field(
        None,
        description="Category: tone, logo_usage, color_usage, restricted_terms, uncategorized"
    )
    rule_text: Optional[str] = Field(
        None,
        description="Updated rule text statement"
    )


class BrandGuidelineRuleResponse(BrandGuidelineRuleBase):
    id: str
    brand_profile_id: str
    created_at: datetime
    updated_at: datetime


class BrandProfileStatusResponse(BaseModel):
    id: str
    status: str
    name: Optional[str] = None
    raw_guideline_file_path: Optional[str] = None
    updated_at: Optional[datetime] = None


class BrandProfileSummaryResponse(BaseModel):
    id: str
    user_id: str
    name: str
    status: str
    raw_guideline_file_path: Optional[str] = None
    color_count: int = 0
    logo_count: int = 0
    rule_count: int = 0
    sample_count: int = 0
    created_at: datetime
    updated_at: datetime


class BrandProfileDetailResponse(BaseModel):
    id: str
    user_id: str
    name: str
    status: str
    raw_guideline_file_path: Optional[str] = None
    signed_guideline_url: Optional[str] = None
    colors: List[BrandColorResponse] = []
    logos: List[BrandLogoResponse] = []
    voice_samples: List[BrandVoiceSampleResponse] = []
    rules: List[BrandGuidelineRuleResponse] = []
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Phase 2: Campaign Briefs & Copy Variant Schemas
# ============================================================================

class CampaignBriefBase(BaseModel):
    brand_profile_id: str
    campaign_goal: str
    target_audience: str
    channel: str = Field(..., description="instagram | linkedin | email | banner_ad | twitter_x | other")
    product_or_feature: str
    additional_context: Optional[str] = None


class CampaignBriefCreate(CampaignBriefBase):
    pass


class CampaignBriefResponse(CampaignBriefBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class GeneratedCopyVariantBase(BaseModel):
    variant_text: str
    variant_type: str = Field(..., description="headline | body | cta | full_post | subject_line")
    generation_index: int = 1
    grounding_voice_sample_ids: List[str] = []
    status: str = Field("generated", description="generated | saved | discarded")


class GeneratedCopyVariantUpdate(BaseModel):
    variant_text: Optional[str] = None
    status: Optional[str] = Field(None, description="generated | saved | discarded")


class GeneratedCopyVariantResponse(GeneratedCopyVariantBase):
    id: str
    campaign_brief_id: str
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Phase 3: Compliance Engine & Audit Schemas
# ============================================================================

class ComplianceAuditRequest(BaseModel):
    variant_id: Optional[str] = Field(None, description="Optional Phase 2 copy variant ID")
    text: Optional[str] = Field(None, description="Optional raw copy text to audit")


class ComplianceFlagResponse(BaseModel):
    id: Optional[str] = None
    audit_id: Optional[str] = None
    flag_type: str = Field(..., description="restricted_term_match | unsubstantiated_claim | missing_disclaimer | off_tone | competitor_comparison | regulatory_risk")
    severity: str = Field(..., description="low | medium | high")
    flagged_text_snippet: str
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    explanation: str
    source_rule_id: Optional[str] = None
    created_at: Optional[datetime] = None


class ComplianceAuditResponse(BaseModel):
    id: str
    variant_id: Optional[str] = None
    raw_text: Optional[str] = None
    brand_profile_id: str
    user_id: str
    overall_score: float
    tone_similarity_score: float
    status: str = Field(..., description="pass | warning | fail")
    cta_present: Optional[bool] = None
    flags: List[ComplianceFlagResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ============================================================================
# Phase 4: Poster Generation & Visual Compliance Audit Schemas
# ============================================================================

class PosterGenerationRequest(BaseModel):
    campaign_brief_id: Optional[str] = None
    custom_prompt: Optional[str] = None
    overlay_text: Optional[str] = None


class PosterGenerationResponse(BaseModel):
    id: str
    visual_audit_id: Optional[str] = None
    campaign_brief_id: Optional[str] = None
    brand_profile_id: str
    background_prompt: str
    final_poster_path: str
    signed_poster_url: Optional[str] = None
    logo_placement: dict = {}
    overlay_text: Optional[str] = None
    status: str = Field("ready", description="generating | ready | failed")
    created_at: datetime


class VisualComplianceAuditResponse(BaseModel):
    id: str
    poster_generation_id: Optional[str] = None
    uploaded_image_path: Optional[str] = None
    signed_image_url: Optional[str] = None
    brand_profile_id: str
    logo_detected: bool
    logo_detector_model: Optional[str] = "haydarkadioglu/brand-eye"
    logo_match_score: float
    logo_bbox: Optional[dict] = None
    color_match_score: float
    text_match_result: Optional[dict] = None
    overall_visual_score: float
    status: str = Field(..., description="pass | warning | fail")
    created_at: datetime



