-- ============================================================================
-- CampaignX Phase 2: Campaign Copy Generation & RAG Schema
-- Migration 002: Briefs, Generated Copy Variants, RLS & Vector Search Function
-- ============================================================================

-- 1. Create Tables

-- 1.1 campaign_briefs
CREATE TABLE IF NOT EXISTS campaign_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_goal TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('instagram', 'linkedin', 'email', 'banner_ad', 'twitter_x', 'other')),
    product_or_feature TEXT NOT NULL,
    additional_context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_briefs_profile_id ON campaign_briefs(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_user_id ON campaign_briefs(user_id);

DROP TRIGGER IF EXISTS tr_campaign_briefs_updated_at ON campaign_briefs;
CREATE TRIGGER tr_campaign_briefs_updated_at
    BEFORE UPDATE ON campaign_briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 1.2 generated_copy_variants
CREATE TABLE IF NOT EXISTS generated_copy_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_brief_id UUID NOT NULL REFERENCES campaign_briefs(id) ON DELETE CASCADE,
    variant_text TEXT NOT NULL,
    variant_type TEXT NOT NULL CHECK (variant_type IN ('headline', 'body', 'cta', 'full_post', 'subject_line')),
    generation_index INT NOT NULL DEFAULT 1,
    grounding_voice_sample_ids UUID[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'saved', 'discarded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_copy_variants_brief_id ON generated_copy_variants(campaign_brief_id);
CREATE INDEX IF NOT EXISTS idx_generated_copy_variants_status ON generated_copy_variants(status);

DROP TRIGGER IF EXISTS tr_generated_copy_variants_updated_at ON generated_copy_variants;
CREATE TRIGGER tr_generated_copy_variants_updated_at
    BEFORE UPDATE ON generated_copy_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 2. pgvector Cosine Similarity Search RPC Function
CREATE OR REPLACE FUNCTION match_brand_voice_samples(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    p_brand_profile_id uuid
)
RETURNS TABLE (
    id uuid,
    brand_profile_id uuid,
    sample_text text,
    source text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        bvs.id,
        bvs.brand_profile_id,
        bvs.sample_text,
        bvs.source,
        1 - (bvs.embedding <=> query_embedding) AS similarity
    FROM brand_voice_samples bvs
    WHERE bvs.brand_profile_id = p_brand_profile_id
      AND bvs.embedding IS NOT NULL
      AND (1 - (bvs.embedding <=> query_embedding)) >= match_threshold
    ORDER BY bvs.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;


-- 3. Row Level Security (RLS) Policies

ALTER TABLE campaign_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_copy_variants ENABLE ROW LEVEL SECURITY;

-- 3.1 campaign_briefs RLS
DROP POLICY IF EXISTS "Users can view own campaign briefs" ON campaign_briefs;
CREATE POLICY "Users can view own campaign briefs"
    ON campaign_briefs FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can insert own campaign briefs" ON campaign_briefs;
CREATE POLICY "Users can insert own campaign briefs"
    ON campaign_briefs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own campaign briefs" ON campaign_briefs;
CREATE POLICY "Users can update own campaign briefs"
    ON campaign_briefs FOR UPDATE
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete own campaign briefs" ON campaign_briefs;
CREATE POLICY "Users can delete own campaign briefs"
    ON campaign_briefs FOR DELETE
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 3.2 generated_copy_variants RLS
DROP POLICY IF EXISTS "Users can view variants of own briefs" ON generated_copy_variants;
CREATE POLICY "Users can view variants of own briefs"
    ON generated_copy_variants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaign_briefs cb
            WHERE cb.id = generated_copy_variants.campaign_brief_id
            AND (cb.user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );

DROP POLICY IF EXISTS "Users can insert variants for own briefs" ON generated_copy_variants;
CREATE POLICY "Users can insert variants for own briefs"
    ON generated_copy_variants FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaign_briefs cb
            WHERE cb.id = generated_copy_variants.campaign_brief_id
            AND (cb.user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );

DROP POLICY IF EXISTS "Users can update variants of own briefs" ON generated_copy_variants;
CREATE POLICY "Users can update variants of own briefs"
    ON generated_copy_variants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM campaign_briefs cb
            WHERE cb.id = generated_copy_variants.campaign_brief_id
            AND (cb.user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );

DROP POLICY IF EXISTS "Users can delete variants of own briefs" ON generated_copy_variants;
CREATE POLICY "Users can delete variants of own briefs"
    ON generated_copy_variants FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM campaign_briefs cb
            WHERE cb.id = generated_copy_variants.campaign_brief_id
            AND (cb.user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );
