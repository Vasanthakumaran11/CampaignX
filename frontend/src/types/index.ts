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
