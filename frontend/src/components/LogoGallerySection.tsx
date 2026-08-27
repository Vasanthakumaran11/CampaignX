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
    <Card className="border-amber-200/80 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <ImageIcon className="w-5 h-5 text-amber-600" />
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
          <div className="text-center py-8 text-slate-500 text-sm font-medium">
            No logo assets extracted yet. Upload a guideline PDF or logo file.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="bg-[#FFFDF0] rounded-2xl border border-amber-200/80 p-4 flex flex-col justify-between space-y-3 group hover:border-amber-300 transition-all shadow-sm"
              >
                {/* Image Container with checkerboard background */}
                <div
                  className="w-full h-32 rounded-xl bg-white border border-amber-200 flex items-center justify-center p-3 relative overflow-hidden"
                  style={{
                    backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                >
                  {logo.signed_url ? (
                    <img
                      src={logo.signed_url}
                      alt={logo.variant_label || 'Brand Logo'}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 gap-1">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-[10px] font-bold">Secure Asset</span>
                    </div>
                  )}

                  {logo.variant_label && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded shadow-2xs">
                      {logo.variant_label}
                    </span>
                  )}
                </div>

                {/* Variant Label Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-bold">Variant Role:</span>
                    {editingId !== logo.id && (
                      <button
                        onClick={() => startEdit(logo)}
                        className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
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
                        className="w-full bg-white border border-amber-300 rounded-lg text-xs text-slate-900 font-bold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(logo.id)}
                        disabled={savingId === logo.id}
                        className="bg-[#0F172A] hover:bg-slate-800 text-white p-1 rounded text-xs disabled:opacity-50 font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-900 truncate font-extrabold">
                      {logo.variant_label || (
                        <span className="text-slate-400 italic font-normal">Unlabeled variant</span>
                      )}
                    </p>
                  )}

                  {logo.min_clear_space_note && (
                    <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 pt-1 border-t border-amber-100">
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
