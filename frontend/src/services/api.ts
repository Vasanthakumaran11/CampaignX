import { 
  BrandProfileSummary, 
  BrandProfileDetail, 
  BrandProfileStatus, 
  BrandColor, 
  BrandLogo, 
  BrandGuidelineRule,
  ColorUsageLabel,
  RuleCategory,
  CampaignBrief,
  GeneratedCopyVariant,
  ComplianceAudit
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchBrandProfiles(): Promise<BrandProfileSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch brand profiles');
  }
  return res.json();
}

export async function fetchBrandProfile(id: string): Promise<BrandProfileDetail> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch brand profile');
  }
  return res.json();
}

export const getBrandProfile = fetchBrandProfile;

export async function fetchBrandProfileStatus(id: string): Promise<BrandProfileStatus> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${id}/status`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to poll brand profile status');
  }
  return res.json();
}

export async function createBrandProfile(name: string): Promise<BrandProfileStatus> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create brand profile');
  }
  return res.json();
}

export async function uploadGuidelinePdf(profileId: string, file: File): Promise<BrandProfileStatus> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}/upload-guideline`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload guideline PDF');
  }
  return res.json();
}

export async function uploadLogos(profileId: string, files: File[], variantLabel?: string): Promise<BrandLogo[]> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  if (variantLabel) {
    formData.append('variant_label', variantLabel);
  }

  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}/upload-logo`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload logos');
  }
  return res.json();
}

export async function uploadVoiceSamples(profileId: string, sampleText: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}/upload-samples`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sample_text: sampleText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload voice samples');
  }
  return res.json();
}

export async function updateColorLabel(profileId: string, colorId: string, usageLabel: ColorUsageLabel): Promise<BrandColor> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}/colors/${colorId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usage_label: usageLabel }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update color label');
  }
  return res.json();
}

export async function updateLogoLabel(profileId: string, logoId: string, variantLabel: string): Promise<BrandLogo> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}/logos/${logoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant_label: variantLabel }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update logo label');
  }
  return res.json();
}

export async function updateRuleCategory(profileId: string, ruleId: string, category: RuleCategory): Promise<BrandGuidelineRule> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}/rules/${ruleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update rule category');
  }
  return res.json();
}

export async function updateRuleText(profileId: string, ruleId: string, ruleText: string): Promise<BrandGuidelineRule> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}/rules/${ruleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rule_text: ruleText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update rule text');
  }
  return res.json();
}

export async function deleteRule(profileId: string, ruleId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}/rules/${ruleId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete rule');
  }
}

export async function deleteVoiceSample(profileId: string, sampleId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}/voice-samples/${sampleId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete voice sample');
  }
}

export async function deleteBrandProfile(profileId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete brand profile');
  }
}

// ============================================================================
// Phase 2: Campaign Briefs & Copy Variant API Services
// ============================================================================

export async function createCampaignBrief(data: {
  brand_profile_id: string;
  campaign_goal: string;
  target_audience: string;
  channel: string;
  product_or_feature: string;
  additional_context?: string;
}): Promise<CampaignBrief> {
  const res = await fetch(`${API_BASE_URL}/api/campaign-briefs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create campaign brief');
  }
  return res.json();
}

export async function getCampaignBrief(id: string): Promise<CampaignBrief> {
  const res = await fetch(`${API_BASE_URL}/api/campaign-briefs/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch campaign brief');
  }
  return res.json();
}

export async function listBrandCampaignBriefs(brandProfileId: string): Promise<CampaignBrief[]> {
  const res = await fetch(`${API_BASE_URL}/api/campaign-briefs/by-brand/${brandProfileId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to list campaign briefs');
  }
  return res.json();
}

export async function generateCopyVariants(briefId: string): Promise<GeneratedCopyVariant[]> {
  const res = await fetch(`${API_BASE_URL}/api/campaign-briefs/${briefId}/generate`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate copy variants');
  }
  return res.json();
}

export async function regenerateCopyVariants(briefId: string): Promise<GeneratedCopyVariant[]> {
  const res = await fetch(`${API_BASE_URL}/api/campaign-briefs/${briefId}/regenerate`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to regenerate copy variants');
  }
  return res.json();
}

export async function listBriefVariants(briefId: string): Promise<GeneratedCopyVariant[]> {
  const res = await fetch(`${API_BASE_URL}/api/campaign-briefs/${briefId}/variants`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch copy variants');
  }
  return res.json();
}

export async function updateCopyVariant(
  briefId: string,
  variantId: string,
  data: { status?: 'generated' | 'saved' | 'discarded'; variant_text?: string }
): Promise<GeneratedCopyVariant> {
  const res = await fetch(`${API_BASE_URL}/api/campaign-briefs/${briefId}/variants/${variantId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update copy variant');
  }
  return res.json();
}

export async function deleteCopyVariant(briefId: string, variantId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/campaign-briefs/${briefId}/variants/${variantId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete copy variant');
  }
}

// ============================================================================
// Phase 3: Compliance Engine API Helpers
// ============================================================================

export async function runComplianceAudit(
  brandProfileId: string,
  payload: { variant_id?: string; text?: string }
): Promise<ComplianceAudit> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${brandProfileId}/compliance/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to run compliance audit');
  }
  return res.json();
}

export async function getComplianceAudit(auditId: string): Promise<ComplianceAudit> {
  const res = await fetch(`${API_BASE_URL}/api/compliance/audits/${auditId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch compliance audit details');
  }
  return res.json();
}

export async function listBrandComplianceAudits(brandProfileId: string): Promise<ComplianceAudit[]> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${brandProfileId}/compliance/audits`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to list brand compliance audits');
  }
  return res.json();
}

export async function getVariantLatestCompliance(briefId: string, variantId: string): Promise<ComplianceAudit | null> {
  const res = await fetch(`${API_BASE_URL}/api/campaign-briefs/${briefId}/variants/${variantId}/compliance`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch variant compliance status');
  }
  return res.json();
}

