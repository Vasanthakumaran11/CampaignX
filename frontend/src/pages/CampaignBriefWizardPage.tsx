import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  Target, 
  Users, 
  Share2, 
  Layers, 
  FileText, 
  Wand2, 
  AlertCircle 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { createCampaignBrief, generateCopyVariants, fetchBrandProfile } from '../services/api';
import { BrandProfileDetail } from '../types';

export const CampaignBriefWizardPage: React.FC = () => {
  const { brandProfileId } = useParams<{ brandProfileId: string }>();
  const navigate = useNavigate();

  const [brand, setBrand] = useState<BrandProfileDetail | null>(null);
  const [isLoadingBrand, setIsLoadingBrand] = useState<boolean>(true);

  // Form State
  const [campaignGoal, setCampaignGoal] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [channel, setChannel] = useState<string>('linkedin');
  const [productOrFeature, setProductOrFeature] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!brandProfileId) return;
    setIsLoadingBrand(true);
    fetchBrandProfile(brandProfileId)
      .then((data: BrandProfileDetail) => setBrand(data))
      .catch((err: unknown) => console.error('Failed to load brand profile:', err))
      .finally(() => setIsLoadingBrand(false));
  }, [brandProfileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandProfileId) return;

    if (!campaignGoal.trim() || !targetAudience.trim() || !productOrFeature.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // 1. Create Brief
      const createdBrief = await createCampaignBrief({
        brand_profile_id: brandProfileId,
        campaign_goal: campaignGoal.trim(),
        target_audience: targetAudience.trim(),
        channel,
        product_or_feature: productOrFeature.trim(),
        additional_context: additionalContext.trim() || undefined,
      });

      // 2. Trigger Initial RAG Generation
      await generateCopyVariants(createdBrief.id);

      // 3. Redirect to Results View
      navigate(`/brands/${brandProfileId}/campaigns/${createdBrief.id}`);
    } catch (err: any) {
      console.error('Failed to create & generate campaign:', err);
      setErrorMessage(err.message || 'Failed to generate campaign copy variants. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/brands/${brandProfileId}`)}
          className="text-xs font-bold text-slate-600 hover:text-amber-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Studio
        </button>

        {brand && (
          <span className="text-xs text-amber-900 font-mono bg-amber-100 px-3 py-1 rounded-full border border-amber-300 font-bold">
            Brand Kit: <span className="text-slate-900 font-extrabold">{brand.name}</span>
          </span>
        )}
      </div>

      {/* Main Card Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Create AI Campaign Brief
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Phase 2: Generates RAG copy variants grounded in your brand's tone anchors and compliance rules.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Campaign Brief Form */}
      <Card className="p-6 sm:p-8 bg-white border-amber-200/80 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Field 1: Campaign Goal */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-600" /> Campaign Goal <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Drive 500 webinar signups for our new AI Career Coach"
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
              className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-inner"
              required
            />
          </div>

          {/* Field 2: Target Audience */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-600" /> Target Audience <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mid-level software engineers seeking career advancement"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-inner"
              required
            />
          </div>

          {/* Field 3: Target Channel & Product Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-amber-600" /> Marketing Channel <span className="text-rose-600">*</span>
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="linkedin">LinkedIn Post</option>
                <option value="twitter">X / Twitter Thread</option>
                <option value="instagram">Instagram Caption</option>
                <option value="facebook">Facebook Ad</option>
                <option value="email">Email Campaign</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" /> Product or Feature Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. FutureReady Pro Studio"
                value={productOrFeature}
                onChange={(e) => setProductOrFeature(e.target.value)}
                className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-inner"
                required
              />
            </div>
          </div>

          {/* Field 4: Additional Context */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-600" /> Additional Context & Guidelines (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Focus on ROI metrics, include call-to-action link, avoid pushy sales jargon..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-inner"
            />
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-amber-100">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isGenerating}
              className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full px-8 shadow-md"
            >
              <Wand2 className="w-5 h-5 mr-1 text-amber-400" /> Generate Grounded RAG Copy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
