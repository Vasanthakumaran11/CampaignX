export type ProfileStatus = 'processing' | 'ready' | 'failed';

export type ColorUsageLabel = 'primary' | 'secondary' | 'accent' | 'background' | 'text' | 'other' | null;

export type RuleCategory = 'tone' | 'logo_usage' | 'color_usage' | 'restricted_terms' | 'uncategorized';

export interface BrandColor {
  id: string;
  brand_profile_id: string;
  hex_code: string;
  usage_label: ColorUsageLabel;
  source: 'guideline_pdf' | 'sample_asset';
  frequency_rank: number;
  created_at: string;
  updated_at: string;
}

export interface BrandLogo {
  id: string;
  brand_profile_id: string;
  file_path: string;
  signed_url?: string;
  variant_label?: string | null;
  min_clear_space_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandVoiceSample {
  id: string;
  brand_profile_id: string;
  sample_text: string;
  source: 'guideline_pdf' | 'user_uploaded';
  has_embedding?: boolean;
  embedding_dimension?: number;
  created_at: string;
  updated_at: string;
}

export interface BrandGuidelineRule {
  id: string;
  brand_profile_id: string;
  rule_text: string;
  category: RuleCategory;
  page_number?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BrandProfileSummary {
  id: string;
  user_id: string;
  name: string;
  status: ProfileStatus;
  raw_guideline_file_path?: string | null;
  color_count: number;
  logo_count: number;
  rule_count: number;
  sample_count: number;
  created_at: string;
  updated_at: string;
}

export interface BrandProfileDetail {
  id: string;
  user_id: string;
  name: string;
  status: ProfileStatus;
  raw_guideline_file_path?: string | null;
  signed_guideline_url?: string | null;
  colors: BrandColor[];
  logos: BrandLogo[];
  voice_samples: BrandVoiceSample[];
  rules: BrandGuidelineRule[];
  created_at: string;
  updated_at: string;
}

export interface BrandProfileStatus {
  id: string;
  status: ProfileStatus;
  name?: string;
  raw_guideline_file_path?: string;
  updated_at?: string;
}

export type CampaignChannel = 'instagram' | 'linkedin' | 'email' | 'banner_ad' | 'twitter_x' | 'other';
export type VariantType = 'headline' | 'body' | 'cta' | 'full_post' | 'subject_line';
export type VariantStatus = 'generated' | 'saved' | 'discarded';

export interface CampaignBrief {
  id: string;
  brand_profile_id: string;
  user_id: string;
  campaign_goal: string;
  target_audience: string;
  channel: CampaignChannel;
  product_or_feature: string;
  additional_context?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedCopyVariant {
  id: string;
  campaign_brief_id: string;
  variant_text: string;
  variant_type: VariantType;
  generation_index: number;
  grounding_voice_sample_ids: string[];
  status: VariantStatus;
  created_at: string;
  updated_at: string;
}

export type FlagType = 
  | 'restricted_term_match'
  | 'unsubstantiated_claim'
  | 'missing_disclaimer'
  | 'off_tone'
  | 'competitor_comparison'
  | 'regulatory_risk'
  | 'missing_cta';

export type FlagSeverity = 'low' | 'medium' | 'high';
export type AuditStatus = 'pass' | 'warning' | 'fail';

export interface ComplianceFlag {
  id?: string;
  audit_id?: string;
  flag_type: FlagType;
  severity: FlagSeverity;
  flagged_text_snippet: string;
  start_offset?: number | null;
  end_offset?: number | null;
  explanation: string;
  source_rule_id?: string | null;
  created_at?: string;
}

export interface ComplianceAudit {
  id: string;
  variant_id?: string | null;
  raw_text?: string | null;
  brand_profile_id: string;
  user_id: string;
  overall_score: number;
  tone_similarity_score: number;
  status: AuditStatus;
  cta_present?: boolean | null;
  flags: ComplianceFlag[];
  created_at?: string;
  updated_at?: string;
}

export interface ReviseVariantResult {
  original_text: string;
  revised_text: string;
  instruction: string;
  variant_id: string;
}

export interface ApproveVariantResult {
  variant_id: string;
  status: string;
  approved_at: string;
  message: string;
}

export interface PosterGeneration {
  id: string;
  visual_audit_id?: string | null;
  campaign_brief_id?: string | null;
  brand_profile_id: string;
  background_prompt: string;
  final_poster_path: string;
  signed_poster_url?: string;
  logo_placement?: { x: number; y: number; width: number; height: number };
  overlay_text?: string | null;
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
}

export interface VisualComplianceAudit {
  id: string;
  poster_generation_id?: string | null;
  uploaded_image_path?: string | null;
  signed_image_url?: string;
  brand_profile_id: string;
  logo_detected: boolean;
  logo_detector_model?: string;
  logo_match_score: number;
  logo_bbox?: { x: number; y: number; w: number; h: number; confidence?: number };
  color_match_score: number;
  text_match_result?: {
    extracted_text: string;
    matches_approved_slogan: boolean;
    flags: string[];
  };
  overall_visual_score: number;
  status: AuditStatus;
  created_at: string;
}


