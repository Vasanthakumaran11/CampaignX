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
    <Card className="border-amber-200/80 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <Palette className="w-5 h-5 text-amber-600" />
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
          <div className="text-center py-8 text-slate-500 text-sm font-medium">
            No colors extracted yet. Upload a guideline PDF or logo to populate the palette.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {colors.map((color) => (
              <div
                key={color.id}
                className="bg-[#FFFDF0] rounded-2xl p-4 border border-amber-200/80 hover:border-amber-300 transition-all flex flex-col justify-between space-y-3 shadow-sm group"
              >
                {/* Swatch */}
                <div
                  className="w-full h-24 rounded-xl shadow-inner flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-[1.02] border border-black/10"
                  style={{ backgroundColor: color.hex_code }}
                >
                  <button
                    onClick={() => handleCopy(color.hex_code)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 backdrop-blur-md text-white text-xs font-mono font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md"
                  >
                    {copiedHex === color.hex_code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Hex
                      </>
                    )}
                  </button>

                  <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950/60 text-white">
                    Color #{colors.indexOf(color) + 1}
                  </span>
                </div>

                {/* Color Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black font-mono text-slate-900">
                      {color.hex_code.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Extracted Palette
                    </span>
                  </div>

                  {/* Usage Dropdown Selector */}
                  <div className="relative">
                    <select
                      value={color.usage_label || ''}
                      onChange={(e) =>
                        handleLabelChange(
                          color.id,
                          e.target.value === '' ? null : (e.target.value as ColorUsageLabel)
                        )
                      }
                      disabled={updatingId === color.id}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
                    >
                      {USAGE_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.value || ''}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <Tag className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
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
