import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  ImageIcon, 
  Check, 
  AlertCircle, 
  Download, 
  RefreshCw 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { VisualAuditResultView } from '../components/VisualAuditResultView';
import { 
  getCampaignBrief, 
  generatePosterForBrief, 
  getVisualAuditDetails 
} from '../services/api';
import { CampaignBrief, PosterGeneration, VisualComplianceAudit } from '../types';

export const PosterGeneratorPage: React.FC = () => {
  const { brandProfileId, id, briefId } = useParams<{ brandProfileId?: string; id?: string; briefId: string }>();
  const brandId = brandProfileId || id;
  const navigate = useNavigate();

  const [brief, setBrief] = useState<CampaignBrief | null>(null);
  const [promptInput, setPromptInput] = useState<string>('');
  const [sloganInput, setSloganInput] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [posterResult, setPosterResult] = useState<PosterGeneration | null>(null);
  const [auditResult, setAuditResult] = useState<VisualComplianceAudit | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (briefId) {
      getCampaignBrief(briefId)
        .then((b) => {
          setBrief(b);
          setPromptInput(`Professional abstract background for ${b.product_or_feature}, ${b.campaign_goal}`);
          setSloganInput(`${b.product_or_feature}: ${b.campaign_goal}`);
        })
        .catch((err) => console.error('Failed to fetch brief:', err));
    }
  }, [briefId]);

  const handleGenerate = async () => {
    if (!briefId) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await generatePosterForBrief(briefId, promptInput, sloganInput);
      setPosterResult(res);

      // Fetch the actual visual audit record that was created for this poster.
      if (res.visual_audit_id) {
        const audit = await getVisualAuditDetails(res.visual_audit_id);
        setAuditResult(audit);
      } else {
        console.warn('Poster generation completed without a visual audit id.');
      }
    } catch (err: any) {
      console.error('Poster generation failed:', err);
      setErrorMessage(err.message || 'Failed to generate poster.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/brands/${brandId}`)}
          className="text-xs font-bold text-slate-600 hover:text-amber-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Studio
        </button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-amber-600" /> Phase 4: Poster Generation & Audit Studio
        </h1>
        <p className="text-sm text-slate-600 font-bold mt-1">
          Generate high-impact creative posters compositing your real brand logo & text onto AI backgrounds with real-time visual compliance auditing.
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Generation Input Card */}
      <Card className="border-amber-300 bg-white shadow-sm rounded-3xl">
        <CardContent className="pt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Background Scene Prompt</label>
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Describe desired background scene..."
                className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Overlay Slogan / CTA Text</label>
              <input
                type="text"
                value={sloganInput}
                onChange={(e) => setSloganInput(e.target.value)}
                placeholder="Enter approved slogan text to overlay..."
                className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              isLoading={isGenerating}
              className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full px-8"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
              {isGenerating ? 'Generating & Auditing Poster...' : 'Generate & Audit Poster'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Output Results */}
      {posterResult && auditResult && (
        <VisualAuditResultView
          audit={auditResult}
          imageUrl={posterResult.signed_poster_url || posterResult.final_poster_path}
        />
      )}
    </div>
  );
};
