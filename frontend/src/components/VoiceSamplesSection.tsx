import React, { useState } from 'react';
import { 
  MessageSquareQuote, 
  Cpu, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  ExternalLink, 
  X,
  Search
} from 'lucide-react';
import { BrandVoiceSample } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { deleteVoiceSample } from '../services/api';

interface VoiceSamplesSectionProps {
  profileId: string;
  samples: BrandVoiceSample[];
  onSampleDeleted?: (deletedSampleId: string) => void;
}

export const VoiceSamplesSection: React.FC<VoiceSamplesSectionProps> = ({
  profileId,
  samples,
  onSampleDeleted,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (sampleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this voice anchor sample?')) {
      return;
    }
    setDeletingId(sampleId);
    try {
      await deleteVoiceSample(profileId, sampleId);
      if (onSampleDeleted) {
        onSampleDeleted(sampleId);
      }
    } catch (err) {
      console.error('Failed to delete voice sample:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Format all voice anchor samples into 2 to 3 structured paragraphs with solid black text
  const renderVoiceParagraphs = () => {
    if (!samples || samples.length === 0) {
      return (
        <div className="text-center py-6 text-slate-500 text-xs italic font-medium">
          No brand voice anchors extracted yet. Upload approved copy or guidelines to index.
        </div>
      );
    }

    const total = samples.length;
    const chunk1Size = Math.max(1, Math.ceil(total / 3));
    const chunk2Size = Math.max(1, Math.ceil((total - chunk1Size) / 2));

    const chunk1 = samples.slice(0, chunk1Size);
    const chunk2 = samples.slice(chunk1Size, chunk1Size + chunk2Size);
    const chunk3 = samples.slice(chunk1Size + chunk2Size);

    const p1Text = chunk1.map((s) => `"${s.sample_text}"`).join(' ');
    const p2Text = chunk2.map((s) => `"${s.sample_text}"`).join(' ');
    const p3Text = chunk3.map((s) => `"${s.sample_text}"`).join(' ');

    return (
      <div className="space-y-4">
        {p1Text && (
          <div className="bg-[#FFFDF0] p-4.5 rounded-2xl border border-amber-300 shadow-2xs space-y-1.5 max-h-48 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 block font-mono">
              Paragraph 1 — Core Voice Identity & Brand Mission
            </span>
            <p className="text-base font-normal text-black leading-relaxed italic" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {p1Text}
            </p>
          </div>
        )}

        {p2Text && (
          <div className="bg-[#FFFDF0] p-4.5 rounded-2xl border border-amber-300 shadow-2xs space-y-1.5 max-h-48 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 block font-mono">
              Paragraph 2 — Tone of Voice & Copywriting Pillars
            </span>
            <p className="text-base font-normal text-black leading-relaxed italic" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {p2Text}
            </p>
          </div>
        )}

        {p3Text && (
          <div className="bg-[#FFFDF0] p-4.5 rounded-2xl border border-amber-300 shadow-2xs space-y-1.5 max-h-48 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 block font-mono">
              Paragraph 3 — Strategic Messaging Anchors & Taglines
            </span>
            <p className="text-base font-normal text-black leading-relaxed italic" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {p3Text}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-amber-300 bg-white">
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-5 flex items-center justify-between cursor-pointer select-none border-b border-amber-200 group bg-[#FFFDE8] rounded-t-3xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 transition-colors flex items-center gap-2">
              Brand Voice & Tone Anchors ({samples.length})
              <Badge variant="indigo" className="text-[10px] font-bold">
                <Cpu className="w-3 h-3" /> MiniLM 384-d
              </Badge>
            </h3>
            <p className="text-xs text-slate-700 font-bold">
              Vectorized voice anchors formatted into 2-3 structured paragraphs in solid black text for optimal readability.
            </p>
          </div>
        </div>

        <button className="text-slate-500 group-hover:text-slate-900 p-1 rounded hover:bg-amber-200/50">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Body Content */}
      {!isCollapsed && (
        <CardContent className="pt-5 pb-5">
          {renderVoiceParagraphs()}
        </CardContent>
      )}
    </Card>
  );
};
