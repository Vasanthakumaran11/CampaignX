import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileDown, 
  ExternalLink,
  ShieldCheck,
  Wand2
} from 'lucide-react';
import { BrandProfileDetail, BrandColor, BrandLogo, BrandGuidelineRule, ProfileStatus } from '../types';
import { 
  fetchBrandProfile, 
  fetchBrandProfileStatus, 
  deleteBrandProfile 
} from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ColorPaletteSection } from '../components/ColorPaletteSection';
import { LogoGallerySection } from '../components/LogoGallerySection';
import { VoiceSamplesSection } from '../components/VoiceSamplesSection';
import { RulesTableSection } from '../components/RulesTableSection';

export const BrandDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<BrandProfileDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<ProfileStatus>('processing');
  const pollingIntervalRef = useRef<number | null>(null);

  const loadProfile = async (silent: boolean = false) => {
    if (!id) return;
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBrandProfile(id);
      setProfile(data);
      setPollingStatus(data.status);
    } catch (err: any) {
      setError(err.message || 'Failed to load brand profile detail.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  useEffect(() => {
    if (pollingStatus === 'processing' && id) {
      pollingIntervalRef.current = window.setInterval(async () => {
        try {
          const statusRes = await fetchBrandProfileStatus(id);
          if (statusRes.status !== 'processing') {
            setPollingStatus(statusRes.status);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            loadProfile(true);
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pollingStatus, id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this brand profile and all its assets?')) {
      return;
    }
    try {
      await deleteBrandProfile(id);
      navigate('/brands');
    } catch (err: any) {
      alert(err.message || 'Failed to delete brand profile.');
    }
  };

  const handleColorUpdated = (updatedColor: BrandColor) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        colors: prev.colors.map((c) => (c.id === updatedColor.id ? updatedColor : c)),
      };
    });
  };

  const handleLogoUpdated = (updatedLogo: BrandLogo) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        logos: prev.logos.map((l) => (l.id === updatedLogo.id ? updatedLogo : l)),
      };
    });
  };

  const handleRuleUpdated = (updatedRule: BrandGuidelineRule) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rules: prev.rules.map((r) => (r.id === updatedRule.id ? updatedRule : r)),
      };
    });
  };

  const handleRuleDeleted = (deletedRuleId: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rules: prev.rules.filter((r) => r.id !== deletedRuleId),
      };
    });
  };

  const handleSampleDeleted = (deletedSampleId: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        voice_samples: prev.voice_samples.filter((s) => s.id !== deletedSampleId),
      };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/brands')}
          className="text-xs font-bold text-slate-600 hover:text-amber-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Library
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/brands/${id}/campaigns/new`)}
          >
            <Wand2 className="w-3.5 h-3.5 mr-1 text-amber-400" /> Generate Campaign Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/brands/${id}/compliance/audit`)}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600" /> Audit Copy
          </Button>
          <Button variant="secondary" size="sm" onClick={() => loadProfile(false)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Profile
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-4 border-amber-300 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 font-bold">Fetching brand kit details...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadProfile(false)}>
            Retry
          </Button>
        </div>
      ) : profile ? (
        <>
          {/* Header Banner Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {profile.name}
                  </h1>
                  {profile.status === 'ready' && (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready & Audited
                    </Badge>
                  )}
                  {profile.status === 'processing' && (
                    <Badge variant="warning">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Processing Ingestion
                    </Badge>
                  )}
                  {profile.status === 'failed' && (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3.5 h-3.5" /> Ingestion Failed
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Profile ID: {profile.id} • Created {new Date(profile.created_at).toLocaleString()}
                </p>
              </div>

              {profile.signed_guideline_url && (
                <a
                  href={profile.signed_guideline_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-md"
                >
                  <FileDown className="w-4 h-4 text-amber-400" /> View Original Guideline PDF
                </a>
              )}
            </div>

            {/* Ingestion Processing Polling Banner */}
            {profile.status === 'processing' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-950 text-xs font-semibold animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span>
                    Async background pipeline is extracting colors via KMeans, vectorizing voice samples, and parsing rules. Polling status every 3s...
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-amber-200 px-2.5 py-1 rounded-full border border-amber-300 font-bold">
                  Live Polling
                </span>
              </div>
            )}

            {/* Quick Metrics Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-amber-100">
              <div className="bg-[#FFFDE8] rounded-2xl p-4 border border-amber-200/80 shadow-sm">
                <span className="text-xs font-bold text-slate-600 block mb-1">Colors Clustered</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {profile.colors.length}
                </span>
              </div>
              <div className="bg-[#FFFDE8] rounded-2xl p-4 border border-amber-200/80 shadow-sm">
                <span className="text-xs font-bold text-slate-600 block mb-1">Logos Extracted</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {profile.logos.length}
                </span>
              </div>
              <div className="bg-[#FFFDE8] rounded-2xl p-4 border border-amber-200/80 shadow-sm">
                <span className="text-xs font-bold text-slate-600 block mb-1">Voice Anchors</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {profile.voice_samples.length}
                </span>
              </div>
              <div className="bg-[#FFFDE8] rounded-2xl p-4 border border-amber-200/80 shadow-sm">
                <span className="text-xs font-bold text-slate-600 block mb-1">Rules Classified</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {profile.rules.length}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Sections */}
          <div className="space-y-8">
            <ColorPaletteSection
              profileId={profile.id}
              colors={profile.colors}
              onColorUpdated={handleColorUpdated}
            />

            <LogoGallerySection
              profileId={profile.id}
              logos={profile.logos}
              onLogoUpdated={handleLogoUpdated}
            />

            <VoiceSamplesSection
              profileId={profile.id}
              samples={profile.voice_samples}
              onSampleDeleted={handleSampleDeleted}
            />

            <RulesTableSection
              profileId={profile.id}
              rules={profile.rules}
              onRuleUpdated={handleRuleUpdated}
              onRuleDeleted={handleRuleDeleted}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};
