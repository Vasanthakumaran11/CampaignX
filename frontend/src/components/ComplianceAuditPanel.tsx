import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  RefreshCw, 
  FileText, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ComplianceAudit, ComplianceFlag, FlagSeverity, AuditStatus } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface ComplianceAuditPanelProps {
  audit: ComplianceAudit;
  onReaudit?: () => void;
  isReauditing?: boolean;
  compact?: boolean;
}

export const ComplianceAuditPanel: React.FC<ComplianceAuditPanelProps> = ({
  audit,
  onReaudit,
  isReauditing = false,
  compact = false
}) => {
  const [selectedFlag, setSelectedFlag] = useState<ComplianceFlag | null>(null);

  const getStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case 'pass':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PASSED AUDIT
          </span>
        );
      case 'warning':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> WARNINGS DETECTED
          </span>
        );
      case 'fail':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> AUDIT FAILED
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: FlagSeverity) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">HIGH SEVERITY</Badge>;
      case 'medium':
        return <Badge variant="warning">MEDIUM SEVERITY</Badge>;
      case 'low':
        return <Badge variant="secondary">LOW SEVERITY</Badge>;
    }
  };

  // Render text with inline highlighted flags
  const renderHighlightedText = () => {
    const text = audit.raw_text || '';
    if (!text || audit.flags.length === 0) {
      return <p className="text-sm text-slate-800 leading-relaxed font-sans font-medium">{text}</p>;
    }

    const sortedFlags = [...audit.flags]
      .filter((f) => f.start_offset != null && f.end_offset != null && f.start_offset >= 0)
      .sort((a, b) => (a.start_offset || 0) - (b.start_offset || 0));

    if (sortedFlags.length === 0) {
      return <p className="text-sm text-slate-800 leading-relaxed font-sans font-medium">{text}</p>;
    }

    const segments = [];
    let lastIndex = 0;

    sortedFlags.forEach((flag, idx) => {
      const start = flag.start_offset || 0;
      const end = flag.end_offset || text.length;

      if (start > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`}>{text.substring(lastIndex, start)}</span>
        );
      }

      const isSelected = selectedFlag === flag;
      let highlightClass = 'bg-amber-200 text-amber-950 border-b-2 border-amber-500 font-semibold';
      if (flag.severity === 'high') {
        highlightClass = 'bg-rose-200 text-rose-950 border-b-2 border-rose-600 font-extrabold';
      } else if (flag.severity === 'low') {
        highlightClass = 'bg-yellow-100 text-yellow-950 border-b border-yellow-500 font-medium';
      }

      segments.push(
        <mark
          key={`flag-${idx}`}
          onClick={() => setSelectedFlag(isSelected ? null : flag)}
          className={`cursor-pointer px-1 py-0.5 rounded transition-all ${highlightClass} ${
            isSelected ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white' : ''
          }`}
          title={flag.explanation}
        >
          {text.substring(start, end)}
        </mark>
      );

      lastIndex = Math.max(lastIndex, end);
    });

    if (lastIndex < text.length) {
      segments.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }

    return <p className="text-sm text-slate-800 leading-relaxed font-sans font-medium">{segments}</p>;
  };

  return (
    <div className="bg-white border border-amber-200/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Header Metric Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFFDE8] border border-amber-300 flex items-center justify-center font-mono font-black text-2xl text-slate-900 shadow-inner">
            <span className={audit.overall_score >= 80 ? 'text-emerald-600' : audit.overall_score >= 50 ? 'text-amber-600' : 'text-rose-600'}>
              {Math.round(audit.overall_score)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Compliance Audit Score</span>
              {getStatusBadge(audit.status)}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Tone Similarity: <span className="font-mono text-amber-900 font-bold">{(audit.tone_similarity_score * 100).toFixed(1)}%</span> • {audit.flags.length} Flag(s) Detected
            </p>
          </div>
        </div>

        {onReaudit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReaudit}
            disabled={isReauditing}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isReauditing ? 'animate-spin' : ''}`} />
            {isReauditing ? 'Auditing...' : 'Re-run Audit'}
          </Button>
        )}
      </div>

      {/* Inline Highlighted Text Section */}
      {audit.raw_text && (
        <div className="bg-[#FFFDF0] border border-amber-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold border-b border-amber-100 pb-2">
            <span className="flex items-center gap-1.5 text-slate-900">
              <FileText className="w-4 h-4 text-amber-600" /> Audited Copy Text (Click highlighted text for details)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Character Length: {audit.raw_text.length}</span>
          </div>
          {renderHighlightedText()}
        </div>
      )}

      {/* Selected Flag Detail Popover */}
      {selectedFlag && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1">
              <Info className="w-4 h-4 text-amber-600" /> Flag Explanation
            </span>
            {getSeverityBadge(selectedFlag.severity)}
          </div>
          <p className="text-xs text-slate-900 font-bold leading-relaxed">{selectedFlag.explanation}</p>
        </div>
      )}

      {/* Flagged Issues List */}
      {audit.flags.length > 0 ? (
        <div className="space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" /> Explainable Compliance Flags ({audit.flags.length})
          </span>
          <div className="grid grid-cols-1 gap-3">
            {audit.flags.map((flag, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedFlag(selectedFlag === flag ? null : flag)}
                className={`p-4 rounded-2xl border text-xs transition-all cursor-pointer ${
                  flag.severity === 'high'
                    ? 'bg-rose-50/80 border-rose-200 hover:border-rose-400'
                    : flag.severity === 'medium'
                    ? 'bg-amber-50/80 border-amber-200 hover:border-amber-400'
                    : 'bg-[#FFFDF0] border-amber-200/80 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 font-bold mb-1.5">
                  <span className="text-slate-900 font-extrabold capitalize flex items-center gap-1.5">
                    {flag.flag_type === 'restricted_term_match' && <ShieldAlert className="w-4 h-4 text-rose-600" />}
                    {flag.flag_type === 'off_tone' && <Sparkles className="w-4 h-4 text-amber-600" />}
                    {flag.flag_type !== 'restricted_term_match' && flag.flag_type !== 'off_tone' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {flag.flag_type.replace(/_/g, ' ')}
                  </span>
                  {getSeverityBadge(flag.severity)}
                </div>

                <p className="text-slate-700 text-xs leading-relaxed mb-2 font-medium">{flag.explanation}</p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 border-t border-amber-100 pt-2 mt-1">
                  <span className="font-mono italic font-semibold text-slate-800 truncate max-w-[280px]">
                    "{flag.flagged_text_snippet}"
                  </span>
                  {flag.source_rule_id && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 font-mono font-bold">
                      <ExternalLink className="w-3 h-3" /> Source Rule Traceable
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-950 font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Zero compliance violations or restricted terms detected in copy. Perfect brand alignment!</span>
        </div>
      )}
    </div>
  );
};
