import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  History, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { fetchBrandProfile, listBrandComplianceAudits } from '../services/api';
import { BrandProfileDetail, ComplianceAudit } from '../types';
import { ComplianceAuditPanel } from '../components/ComplianceAuditPanel';

export const ComplianceHistoryPage: React.FC = () => {
  const { brandProfileId } = useParams<{ brandProfileId: string }>();
  const navigate = useNavigate();

  const [brand, setBrand] = useState<BrandProfileDetail | null>(null);
  const [audits, setAudits] = useState<ComplianceAudit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  useEffect(() => {
    if (!brandProfileId) return;
    setIsLoading(true);
    Promise.all([
      fetchBrandProfile(brandProfileId),
      listBrandComplianceAudits(brandProfileId)
    ])
      .then(([brandData, auditsData]) => {
        setBrand(brandData);
        setAudits(auditsData);
      })
      .catch((err) => console.error('Failed to load compliance audits:', err))
      .finally(() => setIsLoading(false));
  }, [brandProfileId]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/brands/${brandProfileId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Brand Studio
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-amber-600" /> Compliance Audit History
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Past compliance audits for <span className="text-amber-900 font-bold">{brand?.name || 'Brand Kit'}</span>
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(`/brands/${brandProfileId}/compliance/audit`)}
          className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full"
        >
          <ShieldCheck className="w-4 h-4 mr-1 text-amber-400" /> Run New Audit
        </Button>
      </div>

      {/* Audit History List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-600 text-sm font-bold animate-pulse">Loading compliance audit history...</div>
      ) : audits.length === 0 ? (
        <Card className="p-12 text-center space-y-3 bg-white border-amber-200/80 shadow-sm">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">No Compliance Audits Found</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
            You haven't run any compliance audits for this brand profile yet.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/brands/${brandProfileId}/compliance/audit`)}
          >
            Run First Audit
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {audits.map((audit) => {
              const isSelected = selectedAuditId === audit.id;
              return (
                <div key={audit.id} className="space-y-3">
                  <Card
                    onClick={() => setSelectedAuditId(isSelected ? null : audit.id)}
                    className={`p-4 cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 shadow-md'
                        : 'bg-white border-amber-200/80 hover:border-amber-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FFFDE8] border border-amber-300 flex items-center justify-center font-mono font-black text-sm text-slate-900 shadow-inner">
                          <span className={audit.overall_score >= 80 ? 'text-emerald-600' : audit.overall_score >= 50 ? 'text-amber-600' : 'text-rose-600'}>
                            {Math.round(audit.overall_score)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">
                            "{audit.raw_text}"
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Audit ID: {audit.id.substring(0, 8)}... • Tone: {(audit.tone_similarity_score * 100).toFixed(1)}% • {audit.flags.length} flag(s)
                          </p>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-amber-600' : ''}`} />
                    </div>
                  </Card>

                  {isSelected && (
                    <div className="pl-4 border-l-2 border-amber-400">
                      <ComplianceAuditPanel audit={audit} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
