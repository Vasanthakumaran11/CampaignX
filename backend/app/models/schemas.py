"""
Pydantic Schemas for CampaignX Brand Profile Ingestion
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class BrandProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the brand profile")
    user_id: Optional[str] = Field(None, description="Supabase user ID")


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
