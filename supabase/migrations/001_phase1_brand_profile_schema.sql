-- ============================================================================
-- CampaignX Phase 1: Brand Kit Ingestion & Profile Schema
-- Migration 001: Tables, Vector Extension, RLS Policies & Storage Buckets
-- ============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Utility Trigger Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Tables

-- 3.1 brand_profiles
CREATE TABLE IF NOT EXISTS brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    raw_guideline_file_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_status ON brand_profiles(status);

DROP TRIGGER IF EXISTS tr_brand_profiles_updated_at ON brand_profiles;
CREATE TRIGGER tr_brand_profiles_updated_at
    BEFORE UPDATE ON brand_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.2 brand_colors
CREATE TABLE IF NOT EXISTS brand_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    hex_code TEXT NOT NULL,
    usage_label TEXT CHECK (usage_label IN ('primary', 'secondary', 'accent', 'background', 'text', 'other', NULL)),
    source TEXT NOT NULL DEFAULT 'guideline_pdf' CHECK (source IN ('guideline_pdf', 'sample_asset')),
    frequency_rank INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_colors_profile_id ON brand_colors(brand_profile_id);

DROP TRIGGER IF EXISTS tr_brand_colors_updated_at ON brand_colors;
CREATE TRIGGER tr_brand_colors_updated_at
    BEFORE UPDATE ON brand_colors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.3 brand_logos
CREATE TABLE IF NOT EXISTS brand_logos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    variant_label TEXT,
    min_clear_space_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_logos_profile_id ON brand_logos(brand_profile_id);

DROP TRIGGER IF EXISTS tr_brand_logos_updated_at ON brand_logos;
CREATE TRIGGER tr_brand_logos_updated_at
    BEFORE UPDATE ON brand_logos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.4 brand_voice_samples
CREATE TABLE IF NOT EXISTS brand_voice_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    sample_text TEXT NOT NULL,
    embedding vector(384),
    source TEXT NOT NULL DEFAULT 'guideline_pdf' CHECK (source IN ('guideline_pdf', 'user_uploaded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_voice_samples_profile_id ON brand_voice_samples(brand_profile_id);

DROP TRIGGER IF EXISTS tr_brand_voice_samples_updated_at ON brand_voice_samples;
CREATE TRIGGER tr_brand_voice_samples_updated_at
    BEFORE UPDATE ON brand_voice_samples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.5 brand_guideline_rules
CREATE TABLE IF NOT EXISTS brand_guideline_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    rule_text TEXT NOT NULL,
    category TEXT DEFAULT 'uncategorized' CHECK (category IN ('tone', 'logo_usage', 'color_usage', 'restricted_terms', 'uncategorized')),
    page_number INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_guideline_rules_profile_id ON brand_guideline_rules(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_brand_guideline_rules_category ON brand_guideline_rules(category);

DROP TRIGGER IF EXISTS tr_brand_guideline_rules_updated_at ON brand_guideline_rules;
CREATE TRIGGER tr_brand_guideline_rules_updated_at
    BEFORE UPDATE ON brand_guideline_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. Enable Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voice_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guideline_rules ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies for brand_profiles
DROP POLICY IF EXISTS "Users can view own brand profiles" ON brand_profiles;
CREATE POLICY "Users can view own brand profiles"
    ON brand_profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own brand profiles" ON brand_profiles;
CREATE POLICY "Users can create own brand profiles"
    ON brand_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own brand profiles" ON brand_profiles;
CREATE POLICY "Users can update own brand profiles"
    ON brand_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own brand profiles" ON brand_profiles;
CREATE POLICY "Users can delete own brand profiles"
    ON brand_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- 4.2 RLS Policies for brand_colors
DROP POLICY IF EXISTS "Users can view own brand colors" ON brand_colors;
CREATE POLICY "Users can view own brand colors"
    ON brand_colors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_colors.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own brand colors" ON brand_colors;
CREATE POLICY "Users can insert own brand colors"
    ON brand_colors FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_colors.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own brand colors" ON brand_colors;
CREATE POLICY "Users can update own brand colors"
    ON brand_colors FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_colors.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_colors.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own brand colors" ON brand_colors;
CREATE POLICY "Users can delete own brand colors"
    ON brand_colors FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_colors.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

-- 4.3 RLS Policies for brand_logos
DROP POLICY IF EXISTS "Users can view own brand logos" ON brand_logos;
CREATE POLICY "Users can view own brand logos"
    ON brand_logos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_logos.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own brand logos" ON brand_logos;
CREATE POLICY "Users can insert own brand logos"
    ON brand_logos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_logos.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own brand logos" ON brand_logos;
CREATE POLICY "Users can update own brand logos"
    ON brand_logos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_logos.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_logos.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own brand logos" ON brand_logos;
CREATE POLICY "Users can delete own brand logos"
    ON brand_logos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_logos.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

-- 4.4 RLS Policies for brand_voice_samples
DROP POLICY IF EXISTS "Users can view own brand voice samples" ON brand_voice_samples;
CREATE POLICY "Users can view own brand voice samples"
    ON brand_voice_samples FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_voice_samples.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own brand voice samples" ON brand_voice_samples;
CREATE POLICY "Users can insert own brand voice samples"
    ON brand_voice_samples FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_voice_samples.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own brand voice samples" ON brand_voice_samples;
CREATE POLICY "Users can update own brand voice samples"
    ON brand_voice_samples FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_voice_samples.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_voice_samples.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

-- 4.5 RLS Policies for brand_guideline_rules
DROP POLICY IF EXISTS "Users can view own brand guideline rules" ON brand_guideline_rules;
CREATE POLICY "Users can view own brand guideline rules"
    ON brand_guideline_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_guideline_rules.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own brand guideline rules" ON brand_guideline_rules;
CREATE POLICY "Users can insert own brand guideline rules"
    ON brand_guideline_rules FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_guideline_rules.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own brand guideline rules" ON brand_guideline_rules;
CREATE POLICY "Users can update own brand guideline rules"
    ON brand_guideline_rules FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_guideline_rules.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles bp
            WHERE bp.id = brand_guideline_rules.brand_profile_id
            AND bp.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 5. Supabase Storage Buckets Setup (Private by default)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('brand-guidelines', 'brand-guidelines', false, 20971520, ARRAY['application/pdf']::text[]),
    ('brand-logos', 'brand-logos', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']::text[]),
    ('brand-samples', 'brand-samples', false, 10485760, ARRAY['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']::text[])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage object policies for authenticated users
DROP POLICY IF EXISTS "Authenticated users can upload brand guideline files" ON storage.objects;
CREATE POLICY "Authenticated users can upload brand guideline files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id IN ('brand-guidelines', 'brand-logos', 'brand-samples'));

DROP POLICY IF EXISTS "Authenticated users can read their brand objects" ON storage.objects;
CREATE POLICY "Authenticated users can read their brand objects"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id IN ('brand-guidelines', 'brand-logos', 'brand-samples'));

DROP POLICY IF EXISTS "Authenticated users can delete their brand objects" ON storage.objects;
CREATE POLICY "Authenticated users can delete their brand objects"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id IN ('brand-guidelines', 'brand-logos', 'brand-samples'));
