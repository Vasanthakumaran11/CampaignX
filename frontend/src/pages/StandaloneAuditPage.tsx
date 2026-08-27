import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  AlertCircle,
  History
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { fetchBrandProfile, runComplianceAudit } from '../services/api';
import { BrandProfileDetail, ComplianceAudit } from '../types';
import { ComplianceAuditPanel } from '../components/ComplianceAuditPanel';

export const StandaloneAuditPage: React.FC = () => {
  const { brandProfileId } = useParams<{ brandProfileId: string }>();
  const navigate = useNavigate();

  const [brand, setBrand] = useState<BrandProfileDetail | null>(null);
  const [isLoadingBrand, setIsLoadingBrand] = useState<boolean>(true);

  const [rawCopyText, setRawCopyText] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<ComplianceAudit | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!brandProfileId) return;
    setIsLoadingBrand(true);
    fetchBrandProfile(brandProfileId)
      .then((data: BrandProfileDetail) => setBrand(data))
      .catch((err: unknown) => console.error('Failed to fetch brand profile:', err))
      .finally(() => setIsLoadingBrand(false));
  }, [brandProfileId]);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandProfileId || !rawCopyText.trim()) return;

    setIsAuditing(true);
    setErrorMessage(null);

    try {
      const result = await runComplianceAudit(brandProfileId, { text: rawCopyText.trim() });
      setAuditResult(result);
    } catch (err: any) {
      console.error('Compliance audit failed:', err);
      setErrorMessage(err.message || 'Audit failed. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation & Header */}
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
              <ShieldCheck className="w-6 h-6 text-amber-600" /> Standalone Copy Compliance Audit
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Audit external human-written ad copy or drafts against <span className="text-amber-900 font-bold">{brand?.name || 'Brand Kit'}</span>
            </p>
          </div>
        </div>

        <Link to={`/brands/${brandProfileId}/compliance/audits`}>
          <Button variant="secondary" size="sm" className="text-xs">
            <History className="w-3.5 h-3.5 mr-1" /> Audit History
          </Button>
        </Link>
      </div>

      {/* Main Input Card */}
      <Card className="p-6 space-y-4 bg-white border-amber-200/80 shadow-sm">
        <form onSubmit={handleAudit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-900">
                <FileText className="w-4 h-4 text-amber-600" /> Paste Marketing Copy / Ad Text Below
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">{rawCopyText.length} CHARACTERS</span>
            </label>
            <textarea
              rows={5}
              value={rawCopyText}
              onChange={(e) => setRawCopyText(e.target.value)}
              placeholder="Paste headline, social post, email body, or ad copy here to test against brand rules and restricted claims..."
              className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-inner"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isAuditing}
              disabled={!rawCopyText.trim()}
              className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-7"
            >
              <Sparkles className="w-4 h-4 mr-1 text-amber-400" /> Run Compliance Audit
            </Button>
          </div>
        </form>
      </Card>

      {/* Audit Result Display */}
      {auditResult && (
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" /> Audit Analysis & Compliance Report
          </h2>
          <ComplianceAuditPanel audit={auditResult} />
        </div>
      )}
    </div>
  );
};
