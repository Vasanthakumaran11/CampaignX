import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BarChart2, ArrowLeft, Sparkles, ShieldCheck, CheckCircle2,
  AlertTriangle, XCircle, TrendingUp, FileText, Layers,
  Users, Target, Image as ImageIcon, Clock, ChevronRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  fetchBrandProfile, listBrandCampaignBriefs,
  listBrandComplianceAudits
} from '../services/api';
import { BrandProfileDetail, CampaignBrief, ComplianceAudit } from '../types';

const CHANNEL_COLORS: Record<string, string> = {
  linkedin: '#0077B5',
  instagram: '#E1306C',
  twitter_x: '#000000',
  email: '#F59E0B',
  banner_ad: '#8B5CF6',
  other: '#6B7280',
};

const CHANNEL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  twitter_x: 'Twitter/X',
  email: 'Email',
  banner_ad: 'Banner Ad',
  other: 'Other',
};

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={10} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={10} fill="none"
        strokeDasharray={circ}
        strokeDashoffset={circ - fill}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

export const CampaignDashboardPage: React.FC = () => {
  const { brandProfileId } = useParams<{ brandProfileId: string }>();
  const navigate = useNavigate();

  const [brand, setBrand] = useState<BrandProfileDetail | null>(null);
  const [briefs, setBriefs] = useState<CampaignBrief[]>([]);
  const [audits, setAudits] = useState<ComplianceAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!brandProfileId) return;
    setIsLoading(true);
    Promise.all([
      fetchBrandProfile(brandProfileId),
      listBrandCampaignBriefs(brandProfileId),
      listBrandComplianceAudits(brandProfileId),
    ])
      .then(([b, br, au]) => { setBrand(b); setBriefs(br); setAudits(au); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [brandProfileId]);

  // --- KPI Computations ---
  const avgScore = audits.length > 0
    ? Math.round(audits.reduce((s, a) => s + a.overall_score, 0) / audits.length)
    : 0;
  const passCount = audits.filter(a => a.status === 'pass').length;
  const warnCount = audits.filter(a => a.status === 'warning').length;
  const failCount = audits.filter(a => a.status === 'fail').length;
  const approvedVariants = audits.filter(a => a.status === 'pass').length;
  const acceptanceRate = audits.length > 0 ? Math.round((passCount / audits.length) * 100) : 0;

  // Channel distribution
  const channelCounts: Record<string, number> = {};
  briefs.forEach(b => {
    channelCounts[b.channel] = (channelCounts[b.channel] || 0) + 1;
  });
  const maxChannelCount = Math.max(...Object.values(channelCounts), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <BarChart2 className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
          <p className="text-sm font-bold text-slate-600 animate-pulse">Loading Campaign Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(`/brands/${brandProfileId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Brand Studio
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-amber-500" />
              Campaign Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {brand?.name || 'Brand'} — Performance Overview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/brands/${brandProfileId}/compliance/audit`)}>
            <ShieldCheck className="w-4 h-4 mr-1 text-amber-500" /> New Audit
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/brands/${brandProfileId}/campaigns/new`)}>
            <Sparkles className="w-4 h-4 mr-1" /> New Campaign
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: briefs.length, icon: <FileText className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50 border-indigo-200' },
          { label: 'Total Audits', value: audits.length, icon: <ShieldCheck className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50 border-amber-200' },
          { label: 'Avg Compliance', value: `${avgScore}/100`, icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Acceptance Rate', value: `${acceptanceRate}%`, icon: <Target className="w-5 h-5 text-violet-500" />, bg: 'bg-violet-50 border-violet-200' },
        ].map((kpi) => (
          <Card key={kpi.label} className={`p-5 flex items-center gap-4 border ${kpi.bg}`}>
            <div className="p-2 rounded-xl bg-white/80 shadow-sm">{kpi.icon}</div>
            <div>
              <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-500 font-semibold">{kpi.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Score Distribution */}
        <Card className="p-6 bg-white border-amber-200/80 col-span-1">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" /> Audit Outcomes
          </h2>
          {audits.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">No audits yet</div>
          ) : (
            <div className="space-y-4">
              {/* Score ring */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <ScoreRing score={avgScore} size={100} />
                  <div className="absolute inset-0 flex items-center justify-center rotate-90">
                    <span className="text-xl font-black text-slate-900">{avgScore}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-semibold">Avg Score / 100</p>
              </div>
              {/* Status breakdown */}
              <div className="space-y-2">
                {[
                  { label: 'Pass', count: passCount, color: 'bg-emerald-500', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> },
                  { label: 'Warning', count: warnCount, color: 'bg-amber-400', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> },
                  { label: 'Fail', count: failCount, color: 'bg-rose-500', icon: <XCircle className="w-3.5 h-3.5 text-rose-600" /> },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    {s.icon}
                    <span className="text-xs font-semibold text-slate-700 w-14">{s.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all duration-700`}
                        style={{ width: audits.length > 0 ? `${(s.count / audits.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-700 w-5 text-right">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Channel Distribution */}
        <Card className="p-6 bg-white border-amber-200/80 col-span-1">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> Campaign Channels
          </h2>
          {Object.keys(channelCounts).length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">No campaigns yet</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(channelCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([ch, cnt]) => (
                  <div key={ch} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">{CHANNEL_LABELS[ch] || ch}</span>
                      <span className="text-xs font-black text-slate-900">{cnt}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(cnt / maxChannelCount) * 100}%`,
                          backgroundColor: CHANNEL_COLORS[ch] || '#6B7280'
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Recent Audits Feed */}
        <Card className="p-6 bg-white border-amber-200/80 col-span-1">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" /> Recent Audits
          </h2>
          {audits.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">No audits yet</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {audits.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50/60 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                    a.status === 'pass' ? 'bg-emerald-100 text-emerald-700'
                    : a.status === 'warning' ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                  }`}>
                    {Math.round(a.overall_score)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">
                      {a.raw_text ? `"${a.raw_text.substring(0, 40)}..."` : 'Variant Audit'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{a.flags.length} flag(s)</p>
                  </div>
                  <Badge variant={a.status === 'pass' ? 'success' : a.status === 'warning' ? 'warning' : 'secondary'}>
                    {a.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          {audits.length > 0 && (
            <Link
              to={`/brands/${brandProfileId}/compliance/audits`}
              className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
            >
              View Full History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </Card>
      </div>

      {/* Recent Campaigns Table */}
      <Card className="p-6 bg-white border-amber-200/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" /> Recent Campaigns
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate(`/brands/${brandProfileId}/campaigns`)}>
            View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
        {briefs.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No campaigns created yet.</p>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate(`/brands/${brandProfileId}/campaigns/new`)}>
              Create First Campaign
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-100">
                  <th className="text-left font-bold text-slate-500 pb-2 pr-4">Goal</th>
                  <th className="text-left font-bold text-slate-500 pb-2 pr-4">Audience</th>
                  <th className="text-left font-bold text-slate-500 pb-2 pr-4">Channel</th>
                  <th className="text-left font-bold text-slate-500 pb-2 pr-4">Product</th>
                  <th className="text-right font-bold text-slate-500 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {briefs.slice(0, 8).map(b => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-amber-50/40 transition-colors">
                    <td className="py-2.5 pr-4 font-semibold text-slate-800 line-clamp-1 max-w-[180px]">{b.campaign_goal}</td>
                    <td className="py-2.5 pr-4 text-slate-600 line-clamp-1 max-w-[140px]">{b.target_audience}</td>
                    <td className="py-2.5 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: CHANNEL_COLORS[b.channel] || '#6B7280' }}>
                        {CHANNEL_LABELS[b.channel] || b.channel}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600 line-clamp-1 max-w-[140px]">{b.product_or_feature}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => navigate(`/brands/${brandProfileId}/campaigns/${b.id}`)}
                        className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-0.5 ml-auto text-xs"
                      >
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
