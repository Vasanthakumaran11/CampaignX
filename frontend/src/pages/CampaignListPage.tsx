import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft, 
  Target, 
  Share2, 
  Calendar, 
  FileText, 
  Wand2, 
  ChevronRight,
  Layers
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { listBrandCampaignBriefs, fetchBrandProfile } from '../services/api';
import { CampaignBrief, BrandProfileDetail } from '../types';

export const CampaignListPage: React.FC = () => {
  const { brandProfileId } = useParams<{ brandProfileId: string }>();
  const navigate = useNavigate();

  const [briefs, setBriefs] = useState<CampaignBrief[]>([]);
  const [brand, setBrand] = useState<BrandProfileDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!brandProfileId) return;
    loadData();
  }, [brandProfileId]);

  const loadData = async () => {
    if (!brandProfileId) return;
    setIsLoading(true);
    try {
      const brandData = await fetchBrandProfile(brandProfileId);
      setBrand(brandData);

      const briefsData = await listBrandCampaignBriefs(brandProfileId);
      setBriefs(briefsData);
    } catch (err) {
      console.error('Error loading campaign briefs list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/brands/${brandProfileId}`)}
          className="text-xs font-bold text-slate-600 hover:text-amber-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Profile
        </button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(`/brands/${brandProfileId}/campaigns/new`)}
          className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full"
        >
          <Plus className="w-4 h-4 mr-1.5 text-amber-400" /> New AI Campaign Brief
        </Button>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Campaign Copy History
            {brand && (
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-950 px-3 py-1 rounded-full border border-amber-300">
                {brand.name}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            List of generated briefs and on-brand RAG copy variants.
          </p>
        </div>
      </div>

      {/* Briefs List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-4 border-amber-300 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 font-bold">Loading campaign history...</p>
        </div>
      ) : briefs.length === 0 ? (
        <Card className="p-12 text-center space-y-4 border-dashed border-amber-300 bg-white shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center mx-auto">
            <Wand2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">No Campaign Briefs Yet</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
              Create your first campaign brief to generate grounded headlines, social posts, email copy, and CTAs tailored to {brand?.name || 'this brand'}.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/brands/${brandProfileId}/campaigns/new`)}
            className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full"
          >
            Create Brief Now
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {briefs.map((brief) => (
            <div
              key={brief.id}
              onClick={() => navigate(`/brands/${brandProfileId}/campaigns/${brief.id}`)}
              className="bg-white rounded-2xl p-5 border border-amber-200/80 hover:border-amber-300 transition-all cursor-pointer space-y-3 shadow-sm hover:shadow-md group"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                  {brief.product_or_feature}
                </h3>
                <Badge variant="indigo" className="uppercase text-[10px] tracking-wider font-bold">
                  {brief.channel}
                </Badge>
              </div>

              <p className="text-xs text-slate-700 font-medium line-clamp-2">
                Goal: <span className="text-slate-900 font-bold">{brief.campaign_goal}</span>
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-amber-100 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {new Date(brief.created_at).toLocaleDateString()}
                </span>
                <span className="text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View Variants <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
