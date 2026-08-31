import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  Eye, 
  Palette, 
  FileText 
} from 'lucide-react';
import { VisualComplianceAudit } from '../types';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

interface VisualAuditResultViewProps {
  audit: VisualComplianceAudit;
  imageUrl: string;
}

export const VisualAuditResultView: React.FC<VisualAuditResultViewProps> = ({ audit, imageUrl }) => {
  const bbox = audit.logo_bbox;

  return (
    <div className="space-y-6">
      {/* Top Overall Score Bar */}
      <div className="bg-white border border-amber-300 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Score Gauge Ring */}
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-amber-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  audit.overall_visual_score >= 80
                    ? 'text-emerald-500'
                    : audit.overall_visual_score >= 60
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }
                strokeDasharray={`${audit.overall_visual_score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-lg font-black text-slate-900">
              {Math.round(audit.overall_visual_score)}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900">Visual Compliance Audit</h3>
              <Badge
                variant={
                  audit.status === 'pass'
                    ? 'success'
                    : audit.status === 'warning'
                    ? 'warning'
                    : 'destructive'
                }
                className="uppercase tracking-wider font-extrabold text-xs"
              >
                {audit.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 font-bold mt-1">
              Multi-modal score evaluating YOLO logo detection, CLIP similarity, LAB color palette, and OCR text compliance.
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Image Canvas with Overlay + Sub-Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Poster Image with Bounding Box SVG Overlay */}
        <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-4 border border-amber-300 shadow-md relative overflow-hidden flex items-center justify-center">
          <div className="relative inline-block max-w-full">
            <img
              src={imageUrl}
              alt="Visual Audit Poster"
              className="max-h-[500px] w-auto rounded-2xl object-contain shadow-2xl"
            />

            {/* Bounding Box Canvas Overlay for Logo */}
            {audit.logo_detected && bbox && (
              <div
                className="absolute border-2 border-amber-400 bg-amber-400/20 rounded-lg animate-pulse shadow-lg pointer-events-none"
                style={{
                  left: `${bbox.x || 30}px`,
                  top: `${bbox.y || 30}px`,
                  width: `${bbox.w || 120}px`,
                  height: `${bbox.h || 60}px`,
                }}
              >
                <span className="absolute -top-6 left-0 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-sm flex items-center gap-1 whitespace-nowrap">
                  <Sparkles className="w-3 h-3" /> Logo Detected ({Math.round(audit.logo_match_score * 100)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Score Breakdown Cards */}
        <div className="lg:col-span-5 space-y-3">
          {/* Metric 1: Logo Region Detection */}
          <div className="bg-white border border-amber-300 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900">1. Logo Region Detection</span>
              </div>
              <Badge variant={audit.logo_detected ? 'success' : 'destructive'} className="text-[10px]">
                {audit.logo_detected ? 'Detected' : 'Missing'}
              </Badge>
            </div>
            <p className="text-[11px] font-semibold text-slate-600 mt-2">
              {audit.logo_detected
                ? `Logo bounding box located by pretrained YOLO model (${audit.logo_detector_model || 'haydarkadioglu/brand-eye'}).`
                : 'Warning: No visible logo detected in creative poster.'}
            </p>
          </div>

          {/* Metric 2: Logo Identity (CLIP Similarity) */}
          <div className="bg-white border border-amber-300 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900">2. CLIP Logo Identity Match</span>
              </div>
              <span className="text-xs font-mono font-black text-slate-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                {Math.round(audit.logo_match_score * 100)}%
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-600 mt-2">
              Cosine similarity between cropped logo region and brand's stored logo asset.
            </p>
          </div>

          {/* Metric 3: LAB Palette Color Match */}
          <div className="bg-white border border-amber-300 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900">3. CIELAB Color Match</span>
              </div>
              <span className="text-xs font-mono font-black text-slate-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                {Math.round(audit.color_match_score * 100)}%
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-600 mt-2">
              Perceptual color distance matching extracted poster colors against brand palette.
            </p>
          </div>

          {/* Metric 4: OCR Slogan & Claims */}
          <div className="bg-white border border-amber-300 rounded-2xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900">4. OCR Text & Rule Check</span>
              </div>
              <Badge
                variant={
                  audit.text_match_result?.matches_approved_slogan ? 'success' : 'warning'
                }
                className="text-[10px]"
              >
                {audit.text_match_result?.matches_approved_slogan ? 'Verified' : 'Review'}
              </Badge>
            </div>
            {audit.text_match_result?.extracted_text && (
              <p className="text-xs font-bold text-slate-900 bg-[#FFFDF0] p-2.5 rounded-xl border border-amber-200 italic">
                "{audit.text_match_result.extracted_text}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
