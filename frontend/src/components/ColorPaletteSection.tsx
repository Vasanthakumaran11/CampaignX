import React, { useState } from 'react';
import { Palette, Check, Copy, Tag } from 'lucide-react';
import { BrandColor, ColorUsageLabel } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { updateColorLabel } from '../services/api';

interface ColorPaletteSectionProps {
  profileId: string;
  colors: BrandColor[];
  onColorUpdated: (updatedColor: BrandColor) => void;
}

const USAGE_OPTIONS: { label: string; value: ColorUsageLabel }[] = [
  { label: 'Unassigned', value: null },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Accent', value: 'accent' },
  { label: 'Background', value: 'background' },
  { label: 'Text', value: 'text' },
  { label: 'Other', value: 'other' },
];

export const ColorPaletteSection: React.FC<ColorPaletteSectionProps> = ({
  profileId,
  colors,
  onColorUpdated,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleLabelChange = async (colorId: string, newLabel: ColorUsageLabel) => {
    setUpdatingId(colorId);
    try {
      const updated = await updateColorLabel(profileId, colorId, newLabel);
      onColorUpdated(updated);
    } catch (err) {
      console.error('Failed to update color label:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card className="border-indigo-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <Palette className="w-5 h-5 text-indigo-400" />
            Extracted Brand Colors ({colors.length})
          </CardTitle>
          <Badge variant="indigo">K-Means Clustered</Badge>
        </div>
        <CardDescription>
          Dominant color palette extracted deterministically from brand guideline assets. Assign semantic usage roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {colors.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No colors extracted yet. Upload a guideline PDF or logo to populate the palette.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {colors.map((color) => (
              <div
                key={color.id}
                className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group"
              >
                {/* Swatch */}
                <div
                  className="w-full h-20 rounded-lg shadow-inner flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-[1.02]"
                  style={{ backgroundColor: color.hex_code }}
                >
                  <button
                    onClick={() => handleCopy(color.hex_code)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 hover:bg-slate-900 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1 shadow backdrop-blur-sm"
                  >
                    {copiedHex === color.hex_code ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Hex
                      </>
                    )}
                  </button>
                  <span className="absolute bottom-1 right-2 text-[10px] bg-black/40 text-white/80 px-1.5 py-0.5 rounded font-mono">
                    Rank #{color.frequency_rank}
                  </span>
                </div>

                {/* Details & Select */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold tracking-wider text-slate-200">
                      {color.hex_code.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {color.source.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <select
                      value={color.usage_label || ''}
                      onChange={(e) =>
                        handleLabelChange(color.id, (e.target.value || null) as ColorUsageLabel)
                      }
                      disabled={updatingId === color.id}
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-md text-xs text-slate-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                    >
                      {USAGE_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.value || ''}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
