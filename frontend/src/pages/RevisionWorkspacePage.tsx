import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit3, ShieldCheck, ArrowLeft, Wand2, RotateCw,
  CheckCircle2, AlertTriangle, XCircle, ChevronDown,
  Lightbulb, Copy, Check
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { runComplianceAudit } from '../services/api';
import { ComplianceAudit, ComplianceFlag } from '../types';

const FLAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  restricted_term_match: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  unsubstantiated_claim: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  missing_disclaimer: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  off_tone: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  competitor_comparison: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-300' },
  regulatory_risk: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  missing_cta: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
};

const FLAG_LABELS: Record<string, string> = {
  restricted_term_match: 'Restricted Term',
  unsubstantiated_claim: 'Unsupported Claim',
  missing_disclaimer: 'Missing Disclaimer',
  off_tone: 'Off-Brand Tone',
  competitor_comparison: 'Competitor Mention',
  regulatory_risk: 'Regulatory Risk',
  missing_cta: 'Missing CTA',
};

function InlineHighlightedText({ text, flags }: { text: string; flags: ComplianceFlag[] }) {
  if (!flags.length) return <span>{text}</span>;

  // Build highlight ranges from flags with offsets
  const ranges: Array<{ start: number; end: number; flag: ComplianceFlag }> = [];
  flags.forEach(f => {
    if (f.start_offset != null && f.end_offset != null) {
      ranges.push({ start: f.start_offset, end: f.end_offset, flag: f });
    } else if (f.flagged_text_snippet) {
      const idx = text.indexOf(f.flagged_text_snippet);
      if (idx >= 0) {
        ranges.push({ start: idx, end: idx + f.flagged_text_snippet.length, flag: f });
      }
    }
  });
  ranges.sort((a, b) => a.start - b.start);

  if (!ranges.length) return <span className="whitespace-pre-wrap">{text}</span>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, i) => {
    if (r.start > cursor) {
      parts.push(<span key={`plain-${i}`}>{text.slice(cursor, r.start)}</span>);
    }
    const colors = FLAG_COLORS[r.flag.flag_type] || { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' };
    parts.push(
      <mark
        key={`hl-${i}`}
        title={r.flag.explanation}
        className={`${colors.bg} ${colors.text} px-0.5 rounded border-b-2 ${colors.border} cursor-help`}
      >
        {text.slice(r.start, r.end)}
      </mark>
    );
    cursor = r.end;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);

  return <span className="whitespace-pre-wrap">{parts}</span>;
}

export const RevisionWorkspacePage: React.FC = () => {
  const { brandProfileId } = useParams<{ brandProfileId: string }>();
  const navigate = useNavigate();

  const [copyText, setCopyText] = useState('');
  const [audit, setAudit] = useState<ComplianceAudit | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAudit = async () => {
    if (!brandProfileId || !copyText.trim()) return;
    setIsAuditing(true);
    setAudit(null);
    setError(null);
    try {
      const result = await runComplianceAudit(brandProfileId, { text: copyText.trim() });
      setAudit(result);
    } catch (err: any) {
      setError(err.message || 'Audit failed');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearAndRedo = () => {
    setAudit(null);
    setError(null);
  };

  const highFlags = audit?.flags.filter(f => f.severity === 'high') || [];
  const medFlags = audit?.flags.filter(f => f.severity === 'medium') || [];
  const lowFlags = audit?.flags.filter(f => f.severity === 'low') || [];
  const ctaPresent = audit?.cta_present;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(`/brands/${brandProfileId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-amber-500" />
              Revision Workspace
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Paste copy → audit → see inline flags → edit → re-audit
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAudit}
          isLoading={isAuditing}
          disabled={!copyText.trim() || isAuditing}
          id="run-audit-btn"
        >
          <ShieldCheck className="w-4 h-4 mr-1" />
          {isAuditing ? 'Auditing...' : 'Run Compliance Audit'}
        </Button>
      </div>

      {/* Tip bar */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <span>
          Paste any marketing copy in the editor below, click <strong>Run Compliance Audit</strong>, then fix the highlighted violations and audit again.
          The structured score follows the format: <strong>Score: {audit ? Math.round(audit.overall_score) : '??'}/100 | Tone: {audit ? (audit.tone_similarity_score >= 0.7 ? 'Compliant' : 'Non-Compliant') : '??'} | CTA: {ctaPresent === true ? 'Present' : ctaPresent === false ? 'Missing' : '??'} | Restricted Terms: {audit ? (highFlags.filter(f => f.flag_type === 'restricted_term_match').length === 0 ? 'None' : highFlags.filter(f => f.flag_type === 'restricted_term_match').length) : '??'}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor Panel */}
        <div className="space-y-4">
          <Card className="p-5 bg-white border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" /> Copy Editor
              </h2>
              <div className="flex items-center gap-2">
                {audit && (
                  <button onClick={handleClearAndRedo} className="text-xs text-slate-500 hover:text-amber-700 font-bold flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" /> Reset
                  </button>
                )}
                <button onClick={handleCopy} disabled={!copyText} className="text-xs text-slate-500 hover:text-amber-700 font-bold flex items-center gap-1">
                  {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </div>
            <textarea
              id="revision-copy-textarea"
              className="w-full h-64 p-3 rounded-xl border border-amber-200 bg-[#FFFDF8] text-sm font-mono text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400"
              placeholder="Paste your marketing copy here...&#10;&#10;Example:&#10;Experience the world's #1 rated platform. 100% guaranteed results or your money back. Sign up today!"
              value={copyText}
              onChange={e => { setCopyText(e.target.value); if (audit) setAudit(null); }}
            />
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{copyText.length} chars · {copyText.trim().split(/\s+/).filter(Boolean).length} words</span>
              {audit && (
                <span className={`font-bold ${audit.status === 'pass' ? 'text-emerald-600' : audit.status === 'warning' ? 'text-amber-600' : 'text-rose-600'}`}>
                  Last audit: {Math.round(audit.overall_score)}/100 {audit.status.toUpperCase()}
                </span>
              )}
            </div>
          </Card>

          {/* Preview with inline highlights */}
          {audit && (
            <Card className="p-5 bg-[#FFFDF8] border-amber-200/80 space-y-2">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Annotated Preview
                <span className="text-slate-400 font-normal ml-1">(hover over highlights for details)</span>
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed">
                <InlineHighlightedText text={copyText} flags={audit.flags} />
              </p>
            </Card>
          )}
        </div>

        {/* Right: Audit Results */}
        <div className="space-y-4">
          {error && (
            <Card className="p-4 bg-rose-50 border-rose-200 text-rose-700 text-sm font-semibold">
              {error}
            </Card>
          )}

          {!audit && !isAuditing && (
            <Card className="p-10 bg-white border-amber-200/80 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-500">Audit results will appear here</p>
              <p className="text-xs text-slate-400">Paste copy and click "Run Compliance Audit"</p>
            </Card>
          )}

          {isAuditing && (
            <Card className="p-10 bg-white border-amber-200/80 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-600 animate-pulse">Auditing copy...</p>
            </Card>
          )}

          {audit && (
            <>
              {/* Score Card */}
              <Card className={`p-5 border-2 ${audit.status === 'pass' ? 'border-emerald-400 bg-emerald-50' : audit.status === 'warning' ? 'border-amber-400 bg-amber-50' : 'border-rose-400 bg-rose-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-black text-slate-900">
                      {Math.round(audit.overall_score)}<span className="text-base font-semibold text-slate-500">/100</span>
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Brand Compliance Score</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={audit.status === 'pass' ? 'success' : audit.status === 'warning' ? 'warning' : 'secondary'}>
                      {audit.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Structured Result Summary */}
                <div className="mt-4 pt-4 border-t border-current/20 grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Tone', value: audit.tone_similarity_score >= 0.7 ? '✅ Compliant' : '⚠️ Off-Brand' },
                    { label: 'CTA', value: audit.cta_present ? '✅ Present' : '❌ Missing' },
                    { label: 'Restricted Terms', value: highFlags.filter(f => f.flag_type === 'restricted_term_match').length === 0 ? '✅ None' : `❌ ${highFlags.filter(f => f.flag_type === 'restricted_term_match').length} found` },
                    { label: 'Total Flags', value: `${audit.flags.length} issue(s)` },
                  ].map(item => (
                    <div key={item.label} className="bg-white/60 rounded-lg p-2">
                      <p className="font-bold text-slate-500">{item.label}</p>
                      <p className="font-black text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Flag List */}
              {audit.flags.length > 0 ? (
                <Card className="p-5 bg-white border-amber-200/80 space-y-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    {audit.flags.length} Compliance Issue{audit.flags.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {audit.flags.map((flag, i) => {
                      const colors = FLAG_COLORS[flag.flag_type] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                      return (
                        <div key={i} className={`p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-xs font-black ${colors.text}`}>
                              {FLAG_LABELS[flag.flag_type] || flag.flag_type}
                            </span>
                            <Badge variant={flag.severity === 'high' ? 'secondary' : flag.severity === 'medium' ? 'warning' : 'success'}>
                              {flag.severity.toUpperCase()}
                            </Badge>
                          </div>
                          {flag.flagged_text_snippet && (
                            <p className="text-xs font-mono bg-white/70 rounded p-1 text-slate-700 mb-1 line-clamp-2">
                              "{flag.flagged_text_snippet}"
                            </p>
                          )}
                          <p className="text-xs text-slate-600">{flag.explanation}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ) : (
                <Card className="p-5 bg-emerald-50 border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-black text-emerald-800">No compliance issues found!</p>
                  <p className="text-xs text-emerald-600">This copy passes all brand guidelines.</p>
                </Card>
              )}

              {/* Re-audit button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAudit}
                isLoading={isAuditing}
                id="reaudit-btn"
              >
                <RotateCw className="w-4 h-4 mr-2" /> Re-Audit After Edits
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
