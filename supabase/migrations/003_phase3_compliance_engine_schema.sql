-- ============================================================================
-- CampaignX Phase 3: Text Compliance Engine & Audit Schema
-- Migration 003: compliance_audits, compliance_flags & RLS Policies
-- ============================================================================

-- 1. Create Tables

-- 1.1 compliance_audits
CREATE TABLE IF NOT EXISTS compliance_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES generated_copy_variants(id) ON DELETE SET NULL,
    raw_text TEXT,
    brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    tone_similarity_score NUMERIC(4,3) NOT NULL CHECK (tone_similarity_score >= 0 AND tone_similarity_score <= 1),
    status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'fail')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_audits_profile_id ON compliance_audits(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_variant_id ON compliance_audits(variant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_user_id ON compliance_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_status ON compliance_audits(status);

DROP TRIGGER IF EXISTS tr_compliance_audits_updated_at ON compliance_audits;
CREATE TRIGGER tr_compliance_audits_updated_at
    BEFORE UPDATE ON compliance_audits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 1.2 compliance_flags
CREATE TABLE IF NOT EXISTS compliance_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES compliance_audits(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL CHECK (flag_type IN (
        'restricted_term_match',
        'unsubstantiated_claim',
        'missing_disclaimer',
        'off_tone',
        'competitor_comparison',
        'regulatory_risk'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    flagged_text_snippet TEXT NOT NULL,
    start_offset INT,
    end_offset INT,
    explanation TEXT NOT NULL,
    source_rule_id UUID REFERENCES brand_guideline_rules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_flags_audit_id ON compliance_flags(audit_id);
CREATE INDEX IF NOT EXISTS idx_compliance_flags_flag_type ON compliance_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_compliance_flags_severity ON compliance_flags(severity);


-- 2. Row Level Security (RLS) Policies

ALTER TABLE compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_flags ENABLE ROW LEVEL SECURITY;

-- 2.1 compliance_audits RLS
DROP POLICY IF EXISTS "Users can view own compliance audits" ON compliance_audits;
CREATE POLICY "Users can view own compliance audits"
    ON compliance_audits FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can insert own compliance audits" ON compliance_audits;
CREATE POLICY "Users can insert own compliance audits"
    ON compliance_audits FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own compliance audits" ON compliance_audits;
CREATE POLICY "Users can update own compliance audits"
    ON compliance_audits FOR UPDATE
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete own compliance audits" ON compliance_audits;
CREATE POLICY "Users can delete own compliance audits"
    ON compliance_audits FOR DELETE
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 2.2 compliance_flags RLS
DROP POLICY IF EXISTS "Users can view flags of own audits" ON compliance_flags;
CREATE POLICY "Users can view flags of own audits"
    ON compliance_flags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM compliance_audits ca
            WHERE ca.id = compliance_flags.audit_id
            AND (ca.user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );

DROP POLICY IF EXISTS "Users can insert flags for own audits" ON compliance_flags;
CREATE POLICY "Users can insert flags for own audits"
    ON compliance_flags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM compliance_audits ca
            WHERE ca.id = compliance_flags.audit_id
            AND (ca.user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );

DROP POLICY IF EXISTS "Users can update flags of own audits" ON compliance_flags;
CREATE POLICY "Users can update flags of own audits"
    ON compliance_flags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM compliance_audits ca
            WHERE ca.id = compliance_flags.audit_id
            AND (ca.user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );

DROP POLICY IF EXISTS "Users can delete flags of own audits" ON compliance_flags;
CREATE POLICY "Users can delete flags of own audits"
    ON compliance_flags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM compliance_audits ca
            WHERE ca.id = compliance_flags.audit_id
            AND (ca.user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );
