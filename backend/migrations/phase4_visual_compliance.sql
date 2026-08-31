-- Phase 4: Poster Generation & Visual Compliance Audit Schema Migration

CREATE TABLE IF NOT EXISTS poster_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_brief_id UUID REFERENCES campaign_briefs(id) ON DELETE SET NULL,
    brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
    background_prompt TEXT NOT NULL,
    background_image_path TEXT,
    final_poster_path TEXT NOT NULL,
    logo_placement JSONB DEFAULT '{}'::jsonb,
    overlay_text TEXT,
    status TEXT NOT NULL DEFAULT 'ready',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visual_compliance_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poster_generation_id UUID REFERENCES poster_generations(id) ON DELETE SET NULL,
    uploaded_image_path TEXT,
    brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
    logo_detected BOOLEAN NOT NULL DEFAULT FALSE,
    logo_detector_model TEXT DEFAULT 'haydarkadioglu/brand-eye',
    logo_match_score NUMERIC(5,2) DEFAULT 0.00,
    logo_bbox JSONB,
    color_match_score NUMERIC(5,2) DEFAULT 0.00,
    text_match_result JSONB,
    overall_visual_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pass',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poster_generations_brand ON poster_generations(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_visual_compliance_audits_brand ON visual_compliance_audits(brand_profile_id);
