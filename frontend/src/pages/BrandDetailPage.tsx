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
  Sparkles, 
  ExternalLink,
  ShieldCheck
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

  // Initial load
  useEffect(() => {
    loadProfile();
  }, [id]);

  // Polling effect when processing
  useEffect(() => {
    if (pollingStatus === 'processing' && id) {
      pollingIntervalRef.current = window.setInterval(async () => {
        try {
          const statusRes = await fetchBrandProfileStatus(id);
          if (statusRes.status !== 'processing') {
            setPollingStatus(statusRes.status);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            // Reload full profile to populate extracted colors, logos, rules
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/brands')}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Library
        </button>

        <div className="flex items-center gap-2">
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
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Fetching brand kit details...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl glass-card border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadProfile(false)}>
            Retry
          </Button>
        </div>
      ) : profile ? (
        <>
          {/* Header Banner */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
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
                <p className="text-xs text-slate-400 font-mono">
                  Profile ID: {profile.id} • Created {new Date(profile.created_at).toLocaleString()}
                </p>
              </div>

              {profile.signed_guideline_url && (
                <a
                  href={profile.signed_guideline_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors shadow-sm"
                >
                  <FileDown className="w-4 h-4 text-indigo-400" /> View Original Guideline PDF
                </a>
              )}
            </div>

            {/* Ingestion Processing Polling Banner */}
            {profile.status === 'processing' && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between text-indigo-200 text-xs animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span>
                    Async background pipeline is extracting colors via KMeans, vectorizing voice samples, and parsing rules. Polling status every 3s...
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-500/30">
                  Live Polling
                </span>
              </div>
            )}

            {/* Quick Metrics Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
                <span className="text-xs text-slate-400 block">Colors Clustered</span>
                <span className="text-xl font-extrabold text-indigo-300 font-mono">
                  {profile.colors.length}
                </span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
                <span className="text-xs text-slate-400 block">Logos Extracted</span>
                <span className="text-xl font-extrabold text-indigo-300 font-mono">
                  {profile.logos.length}
                </span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
                <span className="text-xs text-slate-400 block">Voice Anchors</span>
                <span className="text-xl font-extrabold text-indigo-300 font-mono">
                  {profile.voice_samples.length}
                </span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
                <span className="text-xs text-slate-400 block">Rules Classified</span>
                <span className="text-xl font-extrabold text-indigo-300 font-mono">
                  {profile.rules.length}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Sections */}
          <div className="space-y-8">
            {/* Color Palette */}
            <ColorPaletteSection
              profileId={profile.id}
              colors={profile.colors}
              onColorUpdated={handleColorUpdated}
            />

            {/* Logo Gallery */}
            <LogoGallerySection
              profileId={profile.id}
              logos={profile.logos}
              onLogoUpdated={handleLogoUpdated}
            />

            {/* Voice & Tone Samples */}
            <VoiceSamplesSection samples={profile.voice_samples} />

            {/* Rules Table */}
            <RulesTableSection
              profileId={profile.id}
              rules={profile.rules}
              onRuleUpdated={handleRuleUpdated}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};
