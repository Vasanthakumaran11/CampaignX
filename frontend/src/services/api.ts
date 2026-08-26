import { 
  BrandProfileSummary, 
  BrandProfileDetail, 
  BrandProfileStatus, 
  BrandColor, 
  BrandLogo, 
  BrandGuidelineRule,
  ColorUsageLabel,
  RuleCategory 
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

export async function deleteBrandProfile(profileId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/brand-profiles/${profileId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete brand profile');
  }
}
