import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  ImageIcon, 
  Check 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { VisualAuditResultView } from '../components/VisualAuditResultView';
import { auditUploadedPoster } from '../services/api';
import { VisualComplianceAudit } from '../types';

export const StandaloneVisualAuditPage: React.FC = () => {
  const { brandProfileId, id } = useParams<{ brandProfileId?: string; id?: string }>();
  const brandId = brandProfileId || id;
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sloganInput, setSloganInput] = useState<string>('');

  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<VisualComplianceAudit | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setAuditResult(null);
      setErrorMessage(null);
    }
  };

  const handleRunAudit = async () => {
    if (!brandId || !selectedFile) {
      setErrorMessage('Please select a marketing poster image file to audit.');
      return;
    }
    setIsAuditing(true);
    setAuditResult(null);
    setErrorMessage(null);

    try {
      const result = await auditUploadedPoster(brandId, selectedFile, sloganInput);
      setAuditResult(result);
    } catch (err: any) {
      console.error('Visual audit error:', err);
      setErrorMessage(err.message || 'Failed to complete visual audit.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <button
        onClick={() => navigate(`/brands/${brandId}`)}
        className="text-xs font-bold text-slate-600 hover:text-amber-900 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Studio
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-amber-600" /> Standalone Poster Visual Compliance Auditor
        </h1>
        <p className="text-sm text-slate-600 font-bold mt-1">
          Upload any external marketing banner or creative poster image to run automated logo detection, CLIP logo identity matching, LAB color palette validation, and OCR text compliance checks.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Dropzone Card */}
      <Card className="border-amber-300 bg-white shadow-sm rounded-3xl">
        <CardContent className="pt-6 space-y-5">
          {selectedFile ? (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-600 font-medium">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for visual audit
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedFile(null)}>
                Change File
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-3xl p-8 text-center transition-all bg-[#FFFDF0] space-y-4 cursor-pointer group"
              onClick={() => document.getElementById('poster-upload-input')?.click()}
            >
              <input
                id="poster-upload-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 bg-amber-100 text-amber-900 group-hover:bg-amber-500 group-hover:text-slate-950 rounded-2xl flex items-center justify-center mx-auto border border-amber-300 transition-all font-black">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  Click to upload or drag & drop poster image
                </p>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Supports PNG, JPG, WEBP formats up to 15MB
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Approved Slogan / Headline to Verify (Optional)</label>
            <input
              type="text"
              value={sloganInput}
              onChange={(e) => setSloganInput(e.target.value)}
              placeholder="Enter expected slogan to check against OCR text..."
              className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleRunAudit}
              isLoading={isAuditing}
              disabled={!selectedFile}
              className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full px-8"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-400" /> Run Visual Compliance Audit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visual Audit Result */}
      {auditResult && (
        <VisualAuditResultView
          audit={auditResult}
          imageUrl={auditResult.signed_image_url || auditResult.uploaded_image_path || ''}
        />
      )}
    </div>
  );
};
