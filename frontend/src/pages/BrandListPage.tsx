import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  Layers, 
  Palette, 
  FileText 
} from 'lucide-react';
import { BrandProfileSummary } from '../types';
import { fetchBrandProfiles, deleteBrandProfile } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

export const BrandListPage: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<BrandProfileSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBrandProfiles();
      setProfiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load brand profiles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this brand profile and all its extracted assets?')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteBrandProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete profile');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3 animate-spin" /> Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Phase 1: Ingestion & Compliance Foundation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Brand Kit Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage ingested brand guidelines, logo repositories, vector tone anchors, and extracted compliance rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/brands/new')} variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1" /> New Brand Profile
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading brand profiles from Supabase...</p>
        </div>
      ) : error ? (
        <Card className="border-rose-500/30 bg-rose-950/10">
          <div className="flex items-center justify-between text-rose-300 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadProfiles}>
              Retry
            </Button>
          </div>
        </Card>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl glass-card border border-dashed border-slate-800 space-y-5">
          <div className="w-16 h-16 bg-indigo-950/80 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30 glow-indigo">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-100">No brand profiles found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get started by uploading your company's official brand guideline PDF, logo lockups, and sample approved copy to build your first AI-audited Brand Kit.
            </p>
          </div>
          <Button onClick={() => navigate('/brands/new')} variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1" /> Ingest Your First Brand Kit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => navigate(`/brands/${profile.id}`)}
              className="glass-card rounded-xl p-5 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-5 group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {profile.name}
                  </h3>
                  {getStatusBadge(profile.status)}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800/60">
                    <span className="text-xs font-bold text-slate-200 block">{profile.color_count}</span>
                    <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                      <Palette className="w-2.5 h-2.5" /> Colors
                    </span>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800/60">
                    <span className="text-xs font-bold text-slate-200 block">{profile.logo_count}</span>
                    <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                      <Layers className="w-2.5 h-2.5" /> Logos
                    </span>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800/60">
                    <span className="text-xs font-bold text-slate-200 block">{profile.rule_count}</span>
                    <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                      <FileText className="w-2.5 h-2.5" /> Rules
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <span>Updated {new Date(profile.updated_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(profile.id, e)}
                    disabled={deletingId === profile.id}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800/60 transition-colors"
                    title="Delete Brand Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                    Review <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
