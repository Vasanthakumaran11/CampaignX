import React, { useState } from 'react';
import { Image as ImageIcon, Check, Edit2, ShieldAlert } from 'lucide-react';
import { BrandLogo } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { updateLogoLabel } from '../services/api';

interface LogoGallerySectionProps {
  profileId: string;
  logos: BrandLogo[];
  onLogoUpdated: (updatedLogo: BrandLogo) => void;
}

export const LogoGallerySection: React.FC<LogoGallerySectionProps> = ({
  profileId,
  logos,
  onLogoUpdated,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [variantText, setVariantText] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEdit = (logo: BrandLogo) => {
    setEditingId(logo.id);
    setVariantText(logo.variant_label || '');
  };

  const saveEdit = async (logoId: string) => {
    setSavingId(logoId);
    try {
      const updated = await updateLogoLabel(profileId, logoId, variantText.trim());
      onLogoUpdated(updated);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update logo label:', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="border-indigo-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            Extracted Logo Assets ({logos.length})
          </CardTitle>
          <Badge variant="indigo">PyMuPDF Extracted</Badge>
        </div>
        <CardDescription>
          Embedded logo and visual marks extracted from guideline pages. Assign variant roles (e.g. Primary Lockup, Monochrome, Icon-Only).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logos.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No logo assets extracted yet. Upload a guideline PDF or logo file.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 flex flex-col justify-between space-y-3 group hover:border-slate-700 transition-all"
              >
                {/* Image Container with checkerboard background for transparent logos */}
                <div
                  className="w-full h-32 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-center p-3 relative overflow-hidden"
                  style={{
                    backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                >
                  {logo.signed_url ? (
                    <img
                      src={logo.signed_url}
                      alt={logo.variant_label || 'Brand Logo'}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 gap-1">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-[10px]">Secure Asset</span>
                    </div>
                  )}

                  {logo.variant_label && (
                    <span className="absolute top-2 left-2 text-[10px] font-semibold bg-indigo-950/90 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded shadow">
                      {logo.variant_label}
                    </span>
                  )}
                </div>

                {/* Variant Label Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Variant Role:</span>
                    {editingId !== logo.id && (
                      <button
                        onClick={() => startEdit(logo)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>

                  {editingId === logo.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Primary Lockup"
                        value={variantText}
                        onChange={(e) => setVariantText(e.target.value)}
                        className="w-full bg-slate-950 border border-indigo-500/50 rounded text-xs text-slate-100 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(logo.id)}
                        disabled={savingId === logo.id}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded text-xs disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-200 truncate font-medium">
                      {logo.variant_label || (
                        <span className="text-slate-500 italic">Unlabeled variant</span>
                      )}
                    </p>
                  )}

                  {logo.min_clear_space_note && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-800/60">
                      <ShieldAlert className="w-3 h-3 text-slate-500" />
                      {logo.min_clear_space_note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
