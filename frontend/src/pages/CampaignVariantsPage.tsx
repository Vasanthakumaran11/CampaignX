import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Wand2, 
  ArrowLeft, 
  Sparkles, 
  Bookmark, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  RotateCw, 
  Layers, 
  Share2, 
  Tag, 
  CheckCircle2, 
  Ban, 
  Copy,
  ExternalLink,
  Eye,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ComplianceAuditPanel } from '../components/ComplianceAuditPanel';
import { 
  getCampaignBrief, 
  listBriefVariants, 
  regenerateCopyVariants, 
  updateCopyVariant, 
  deleteCopyVariant,
  fetchBrandProfile,
  runComplianceAudit,
  getVariantLatestCompliance,
  reviseVariant,
  approveVariant
} from '../services/api';
import { CampaignBrief, GeneratedCopyVariant, VariantType, BrandProfileDetail, ComplianceAudit } from '../types';
import { Wand2 as ReviseIcon } from 'lucide-react';

interface GroupedCardConfig {
  type: VariantType;
  title: string;
  badgeVariant: 'indigo' | 'success' | 'warning' | 'secondary';
  borderClass: string;
}

const TYPE_CONFIGS: GroupedCardConfig[] = [
  { type: 'headline', title: 'Headlines & Hooks', badgeVariant: 'indigo', borderClass: 'border-amber-200/90' },
  { type: 'subject_line', title: 'Email Subject Lines', badgeVariant: 'warning', borderClass: 'border-amber-200/90' },
  { type: 'body', title: 'Body Copy & Narratives', badgeVariant: 'secondary', borderClass: 'border-amber-200/90' },
  { type: 'full_post', title: 'Full Social Posts & Captions', badgeVariant: 'indigo', borderClass: 'border-amber-200/90' },
  { type: 'cta', title: 'Call to Actions (CTAs)', badgeVariant: 'success', borderClass: 'border-amber-200/90' },
];

export const CampaignVariantsPage: React.FC = () => {
  const { brandProfileId, briefId } = useParams<{ brandProfileId: string; briefId: string }>();
  const navigate = useNavigate();

  const [brief, setBrief] = useState<CampaignBrief | null>(null);
  const [brand, setBrand] = useState<BrandProfileDetail | null>(null);
  const [variants, setVariants] = useState<GeneratedCopyVariant[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Click-to-reveal edit state
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Compliance Audit state
  const [auditsMap, setAuditsMap] = useState<Record<string, ComplianceAudit>>({});
  const [auditingVariantId, setAuditingVariantId] = useState<string | null>(null);

  // Revise state
  const [revisingVariantId, setRevisingVariantId] = useState<string | null>(null);
  const [reviseInputMap, setReviseInputMap] = useState<Record<string, string>>({});
  const [showReviseInputId, setShowReviseInputId] = useState<string | null>(null);

  // Approve state
  const [approvingVariantId, setApprovingVariantId] = useState<string | null>(null);
  const [approvedVariants, setApprovedVariants] = useState<Set<string>>(new Set());

  const handleReviseVariant = async (variantId: string, briefId: string) => {
    const instruction = reviseInputMap[variantId]?.trim();
    if (!instruction) return;
    setRevisingVariantId(variantId);
    try {
      const result = await reviseVariant(briefId, variantId, instruction);
      setVariants(prev =>
        prev.map(v => v.id === variantId ? { ...v, variant_text: result.revised_text } : v)
      );
      setReviseInputMap(prev => ({ ...prev, [variantId]: '' }));
      setShowReviseInputId(null);
      // Clear old audit since text changed
      setAuditsMap(prev => { const n = { ...prev }; delete n[variantId]; return n; });
    } catch (err) {
      console.error('Revision failed:', err);
    } finally {
      setRevisingVariantId(null);
    }
  };

  const handleApproveVariant = async (variantId: string, briefId: string) => {
    setApprovingVariantId(variantId);
    try {
      await approveVariant(briefId, variantId);
      setApprovedVariants(prev => new Set(prev).add(variantId));
      setVariants(prev =>
        prev.map(v => v.id === variantId ? { ...v, status: 'saved' } : v)
      );
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setApprovingVariantId(null);
    }
  };

  const handleAuditVariant = async (variantId: string) => {
    if (!brandProfileId) return;
    setAuditingVariantId(variantId);
    try {
      const audit = await runComplianceAudit(brandProfileId, { variant_id: variantId });
      setAuditsMap((prev) => ({ ...prev, [variantId]: audit }));
    } catch (err) {
      console.error('Failed to audit variant compliance:', err);
    } finally {
      setAuditingVariantId(null);
    }
  };

  useEffect(() => {
    if (!briefId) return;
    loadData();
  }, [briefId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (briefId) {
        const briefData = await getCampaignBrief(briefId);
        setBrief(briefData);

        const variantsData = await listBriefVariants(briefId);
        setVariants(variantsData);

        if (briefData.brand_profile_id) {
          const brandData = await fetchBrandProfile(briefData.brand_profile_id);
          setBrand(brandData);
        }
      }
    } catch (err) {
      console.error('Error loading campaign variants data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!briefId) return;
    setIsRegenerating(true);
    try {
      const newVariants = await regenerateCopyVariants(briefId);
      setVariants((prev) => [...newVariants, ...prev]);
    } catch (err) {
      console.error('Failed to regenerate variants:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = (id: string, text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (variantId: string, newStatus: 'saved' | 'discarded' | 'generated', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!briefId) return;
    setSavingId(variantId);
    try {
      const updated = await updateCopyVariant(briefId, variantId, { status: newStatus });
      setVariants((prev) => prev.map((v) => (v.id === variantId ? updated : v)));
    } catch (err) {
      console.error('Failed to update variant status:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveText = async (variantId: string) => {
    if (!briefId) return;
    setSavingId(variantId);
    try {
      const updated = await updateCopyVariant(briefId, variantId, { variant_text: editText.trim() });
      setVariants((prev) => prev.map((v) => (v.id === variantId ? updated : v)));
      setEditingVariantId(null);
    } catch (err) {
      console.error('Failed to save variant text:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!briefId) return;
    if (!window.confirm('Are you sure you want to delete this copy variant?')) return;
    setSavingId(variantId);
    try {
      await deleteCopyVariant(briefId, variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      setEditingVariantId(null);
    } catch (err) {
      console.error('Failed to delete variant:', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/brands/${brandProfileId}`)}
          className="text-xs font-bold text-slate-600 hover:text-amber-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Studio
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            isLoading={isRegenerating}
          >
            <RotateCw className="w-3.5 h-3.5 mr-1 text-amber-600" /> Regenerate More Copy
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/brands/${brandProfileId}/campaigns/new`)}
          >
            <Wand2 className="w-3.5 h-3.5 mr-1 text-amber-400" /> New Campaign Brief
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/brands/${brandProfileId}/campaigns/${briefId}/poster`)}
          >
            <ImageIcon className="w-3.5 h-3.5 mr-1 text-amber-600" /> Generate Poster
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-4 border-amber-300 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 font-bold">Retrieving grounded copy variants...</p>
        </div>
      ) : brief ? (
        <>
          {/* Campaign Brief Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {brief.product_or_feature}
                  </h1>
                  <Badge variant="indigo" className="uppercase text-[10px] tracking-wider font-bold">
                    {brief.channel}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  Goal: <span className="text-slate-900 font-bold">{brief.campaign_goal}</span>
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  Target Audience: <span className="text-slate-800 font-semibold">{brief.target_audience}</span>
                </p>
              </div>

              {brand && (
                <div className="bg-[#FFFDE8] px-4 py-3 rounded-2xl border border-amber-200/80 text-xs text-slate-600 font-medium">
                  Grounded by Brand Kit:{' '}
                  <span className="font-extrabold text-slate-900 block text-sm">{brand.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grouped Variants Cards by Type */}
          <div className="space-y-6">
            {TYPE_CONFIGS.map((cfg) => {
              const typeVariants = variants.filter((v) => v.variant_type === cfg.type);
              if (typeVariants.length === 0) return null;

              return (
                <Card key={cfg.type} className={`border ${cfg.borderClass} bg-white shadow-sm`}>
                  {/* Card Header */}
                  <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between bg-[#FFFDE8] rounded-t-2xl">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {cfg.title} <span className="text-xs text-slate-500 font-normal">({typeVariants.length})</span>
                      </h3>
                    </div>
                    <Badge variant={cfg.badgeVariant} className="text-[10px]">
                      {typeVariants.length} Generated
                    </Badge>
                  </div>

                  {/* List of Variants with Click-to-Reveal Editing */}
                  <div className="p-4 space-y-3">
                    {typeVariants.map((variant, idx) => {
                      const isEditing = editingVariantId === variant.id;
                      const isSaved = variant.status === 'saved';
                      const isDiscarded = variant.status === 'discarded';
                      const variantAudit = auditsMap[variant.id];

                      return (
                        <div
                          key={variant.id}
                          onClick={() => {
                            if (!isEditing) {
                              setEditingVariantId(variant.id);
                              setEditText(variant.variant_text);
                            }
                          }}
                          className={`rounded-2xl p-4 transition-all border ${
                            isSaved
                              ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                              : isDiscarded
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : isEditing
                              ? 'bg-amber-50 border-amber-400 shadow-md'
                              : 'bg-[#FFFDF0] border-amber-200/80 hover:bg-amber-100/40 hover:border-amber-300 cursor-pointer'
                          }`}
                        >
                          {isEditing ? (
                            /* EDIT MODE */
                            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                  <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Edit Copy Statement
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 font-bold">
                                  Batch #{variant.generation_index}
                                </span>
                              </div>

                              <textarea
                                rows={4}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-white border border-amber-300 rounded-2xl p-3.5 text-xs text-slate-900 leading-relaxed font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                              />

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-100">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant={isSaved ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusChange(variant.id, isSaved ? 'generated' : 'saved')}
                                    disabled={savingId === variant.id}
                                  >
                                    <Bookmark className="w-3 h-3 mr-1" />
                                    {isSaved ? 'Saved Finalist' : 'Mark as Finalist'}
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteVariant(variant.id)}
                                    disabled={savingId === variant.id}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                                  </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setEditingVariantId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleSaveText(variant.id)}
                                    isLoading={savingId === variant.id}
                                  >
                                    <Check className="w-3 h-3 mr-1" /> Save Copy
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* COMPACT SINGLE-LINE / PARAGRAPH VIEW */
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 mt-0.5 shrink-0">
                                    #{idx + 1}
                                  </span>
                                  <p className="text-xs text-slate-900 leading-relaxed font-bold">
                                    "{variant.variant_text}"
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleAuditVariant(variant.id)}
                                    disabled={auditingVariantId === variant.id}
                                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-all flex items-center gap-1 shadow-2xs"
                                  >
                                    <ShieldCheck className="w-3 h-3 text-amber-600" /> Audit
                                  </button>

                                  <button
                                    onClick={(e) => handleCopy(variant.id, variant.variant_text, e)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-amber-100 transition-colors"
                                    title="Copy text"
                                  >
                                    {copiedId === variant.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={(e) => handleStatusChange(variant.id, isSaved ? 'generated' : 'saved', e)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isSaved ? 'text-amber-600 hover:text-amber-700' : 'text-slate-400 hover:text-amber-600'
                                    }`}
                                    title={isSaved ? 'Unbookmark' : 'Bookmark as Finalist'}
                                  >
                                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
                                  </button>
                                </div>
                              </div>

                              {/* Render Inline Compliance Audit Result if Audited */}
                              {variantAudit && (
                                <div className="pt-2">
                                  <ComplianceAuditPanel audit={variantAudit} compact={true} />
                                </div>
                              )}

                              {/* Revise UI */}
                              {showReviseInputId === variant.id ? (
                                <div className="pt-2 space-y-2" onClick={e => e.stopPropagation()}>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="e.g. Make it shorter and remove the guarantee claim..."
                                      value={reviseInputMap[variant.id] || ''}
                                      onChange={e => setReviseInputMap(prev => ({ ...prev, [variant.id]: e.target.value }))}
                                      onKeyDown={e => { if (e.key === 'Enter') handleReviseVariant(variant.id, briefId!); }}
                                      className="flex-1 text-xs border border-violet-300 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleReviseVariant(variant.id, briefId!)}
                                      disabled={!reviseInputMap[variant.id]?.trim() || revisingVariantId === variant.id}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 flex items-center gap-1 transition-colors"
                                    >
                                      {revisingVariantId === variant.id ? <RotateCw className="w-3 h-3 animate-spin" /> : <ReviseIcon className="w-3 h-3" />}
                                      Revise
                                    </button>
                                    <button
                                      onClick={() => setShowReviseInputId(null)}
                                      className="px-2 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 bg-white"
                                    >✕</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="pt-1.5 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => setShowReviseInputId(variant.id)}
                                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition-all flex items-center gap-1"
                                  >
                                    <ReviseIcon className="w-3 h-3" /> AI Revise
                                  </button>
                                  <button
                                    onClick={() => handleApproveVariant(variant.id, briefId!)}
                                    disabled={approvingVariantId === variant.id || approvedVariants.has(variant.id)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
                                      approvedVariants.has(variant.id) || variant.status === 'saved'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border-slate-200 hover:border-emerald-300'
                                    }`}
                                  >
                                    {approvingVariantId === variant.id
                                      ? <RotateCw className="w-3 h-3 animate-spin" />
                                      : <CheckCircle2 className="w-3 h-3" />}
                                    {approvedVariants.has(variant.id) || variant.status === 'saved' ? 'Approved' : 'Approve'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
};
