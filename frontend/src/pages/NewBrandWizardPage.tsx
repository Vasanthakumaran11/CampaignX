import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  X, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { 
  createBrandProfile, 
  saveManualBrandProfile,
  uploadGuidelinePdf, 
  uploadLogos, 
  uploadVoiceSamples 
} from '../services/api';

const MAX_PDF_SIZE_MB = 20;
const MAX_IMG_SIZE_MB = 10;

export const NewBrandWizardPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitProgress, setSubmitProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form fields
  const [brandName, setBrandName] = useState<string>('');
  const [guidelineFile, setGuidelineFile] = useState<File | null>(null);
  const [manualEntryMode, setManualEntryMode] = useState<boolean>(false);
  const [primaryColor, setPrimaryColor] = useState<string>('#0F172A');
  const [secondaryColor, setSecondaryColor] = useState<string>('#F59E0B');
  const [accentColor, setAccentColor] = useState<string>('#E2E8F0');
  const [brandTone, setBrandTone] = useState<string>('Friendly, confident, and trustworthy');
  const [voiceExamples, setVoiceExamples] = useState<string[]>(['', '']);
  const [restrictedRules, setRestrictedRules] = useState<string[]>(['Do not claim guaranteed outcomes.', 'Avoid misleading clinical or performance claims.']);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [logoVariantLabel, setLogoVariantLabel] = useState<string>('Primary Lockup');
  const [sampleCopyText, setSampleCopyText] = useState<string>('');

  // Step 2: Drag & drop PDF handler
  const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetPdf(e.dataTransfer.files[0]);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetPdf(e.target.files[0]);
    }
  };

  const validateAndSetPdf = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Only PDF files are supported for brand guidelines.');
      return;
    }
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`PDF file size exceeds the ${MAX_PDF_SIZE_MB}MB limit.`);
      return;
    }
    setGuidelineFile(file);
  };

  // Step 3: Logo files handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const valid = selected.filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        const isValidType = ['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '');
        const isValidSize = f.size <= MAX_IMG_SIZE_MB * 1024 * 1024;
        return isValidType && isValidSize;
      });
      setLogoFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeLogoFile = (idx: number) => {
    setLogoFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submission pipeline
  const handleSubmit = async () => {
    if (!brandName.trim()) {
      setErrorMessage('Please provide a brand profile name.');
      setCurrentStep(1);
      return;
    }

    if (!guidelineFile && !manualEntryMode) {
      setErrorMessage('Please upload a PDF guideline or choose manual entry mode.');
      setCurrentStep(2);
      return;
    }

    if (manualEntryMode) {
      if (logoFiles.length === 0) {
        setErrorMessage('A logo is required before saving a brand profile created manually.');
        setCurrentStep(3);
        return;
      }

      const colors = [primaryColor, secondaryColor, accentColor].filter(Boolean);
      if (colors.length === 0) {
        setErrorMessage('At least one brand color is required.');
        setCurrentStep(3);
        return;
      }

      const validVoiceSamples = voiceExamples.map((v) => v.trim()).filter(Boolean);
      if (validVoiceSamples.length < 2) {
        setErrorMessage('Please provide at least two voice sample statements.');
        setCurrentStep(4);
        return;
      }

      const validRules = restrictedRules.map((r) => r.trim()).filter(Boolean);
      if (validRules.length < 1) {
        setErrorMessage('Please provide at least one restricted brand rule.');
        setCurrentStep(4);
        return;
      }

      if (!brandTone.trim()) {
        setErrorMessage('Please describe the brand tone or voice.');
        setCurrentStep(4);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      setSubmitProgress('Creating brand profile record...');
      const profile = await createBrandProfile(brandName.trim());
      const profileId = profile.id;

      if (guidelineFile) {
        setSubmitProgress('Uploading & parsing brand guideline PDF...');
        await uploadGuidelinePdf(profileId, guidelineFile);
      }

      if (logoFiles.length > 0) {
        setSubmitProgress(`Uploading ${logoFiles.length} logo asset(s)...`);
        await uploadLogos(profileId, logoFiles, logoVariantLabel.trim() || undefined);
      }

      if (manualEntryMode) {
        setSubmitProgress('Saving manual brand profile details...');
        await saveManualBrandProfile(profileId, {
          name: brandName.trim(),
          brand_colors: [
            { hex_code: primaryColor, usage_label: 'primary' },
            { hex_code: secondaryColor, usage_label: 'secondary' },
            { hex_code: accentColor, usage_label: 'accent' },
          ].filter((c) => !!c.hex_code && c.hex_code.trim() !== '').map((c) => ({
            hex_code: c.hex_code,
            usage_label: c.usage_label,
          })),
          tone: brandTone.trim(),
          voice_samples: voiceExamples.map((v) => v.trim()).filter(Boolean),
          restricted_rules: restrictedRules.map((r) => r.trim()).filter(Boolean).map((rule) => ({ rule_text: rule })),
          logo_file_name: logoFiles[0]?.name || 'manual-logo-upload.png',
          logo_file_size_bytes: logoFiles[0]?.size || 1,
        });
      }

      if (sampleCopyText.trim()) {
        setSubmitProgress('Vectorizing approved brand copy samples...');
        await uploadVoiceSamples(profileId, sampleCopyText.trim());
      }

      setSubmitProgress('Ingestion initiated! Redirecting to review studio...');
      setTimeout(() => {
        navigate(`/brands/${profileId}`);
      }, 500);
    } catch (err: any) {
      console.error('Ingestion error:', err);
      setErrorMessage(err.message || 'An error occurred during brand kit ingestion.');
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Brand Identity', icon: ShieldCheck },
    { num: 2, title: 'Guideline PDF', icon: FileText },
    { num: 3, title: 'Logos (Optional)', icon: ImageIcon },
    { num: 4, title: 'Voice Samples (Optional)', icon: MessageSquare },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <button
        onClick={() => navigate('/brands')}
        className="text-xs font-bold text-slate-600 hover:text-amber-900 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Library
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Ingest New Brand Kit
        </h1>
        <p className="text-sm text-slate-600 mt-1 font-medium">
          Turn your company brand guidelines into structured color palettes, vector voice anchors, and automated compliance rules.
        </p>
      </div>

      {/* Stepper Navigation (4 Categories Bar) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((step) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;

          return (
            <div
              key={step.num}
              onClick={() => !isSubmitting && setCurrentStep(step.num)}
              className={`rounded-2xl p-4 border transition-all cursor-pointer flex items-center gap-3 shadow-sm ${
                isActive
                  ? 'border-amber-400 bg-amber-100/80'
                  : isCompleted
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-amber-200/80 bg-white hover:bg-amber-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-2xs ${
                  isActive
                    ? 'bg-[#0F172A] text-white'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-200 text-slate-900'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.num}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-black block text-slate-900 truncate">
                  {step.title}
                </span>
                <span className="text-[11px] font-bold text-slate-600 block">
                  {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Upcoming'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step Content */}
      <Card className="border-amber-200/80 bg-white shadow-sm rounded-3xl">
        <CardContent className="pt-6">
          {/* STEP 1: Name */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Step 1: Name Your Brand Profile</h2>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Enter the official name of the brand or organization.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">
                  Brand / Organization Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation, Veloce Health, Horizon AI"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 2: PDF Upload or Manual Entry */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Step 2: Brand Guideline Source</h2>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Upload a brand guideline PDF if you have one. Otherwise, switch to manual onboarding and complete the required fields below.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <input
                  id="manual-entry-toggle"
                  type="checkbox"
                  checked={manualEntryMode}
                  onChange={(e) => {
                    setManualEntryMode(e.target.checked);
                    if (e.target.checked) setGuidelineFile(null);
                  }}
                  className="h-4 w-4 accent-amber-600"
                />
                <label htmlFor="manual-entry-toggle" className="text-xs font-bold text-slate-800">
                  I do not have a brand guideline PDF. Use manual entry.
                </label>
              </div>

              {!manualEntryMode && (
                <>
                  {guidelineFile ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{guidelineFile.name}</p>
                          <p className="text-xs text-slate-600 font-medium">
                            {(guidelineFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setGuidelineFile(null)}
                        className="text-slate-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handlePdfDrop}
                      className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-3xl p-8 text-center transition-all bg-[#FFFDF0] space-y-4 cursor-pointer group"
                      onClick={() => document.getElementById('pdf-upload-input')?.click()}
                    >
                      <input
                        id="pdf-upload-input"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handlePdfChange}
                      />
                      <div className="w-12 h-12 bg-amber-100 text-amber-900 group-hover:bg-amber-500 group-hover:text-slate-950 rounded-2xl flex items-center justify-center mx-auto border border-amber-300 transition-all font-black">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          Click to upload or drag & drop guideline PDF
                        </p>
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          PDF format up to {MAX_PDF_SIZE_MB}MB
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {manualEntryMode && (
                <div className="space-y-5 rounded-3xl border border-amber-200 bg-[#FFFDF0] p-5">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Manual onboarding required fields</h3>
                    <p className="text-[11px] text-slate-600 mt-1">
                      A manual brand profile is only valid once a logo, primary color, tone, and at least two voice examples are added.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Primary color</label>
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-11 rounded-xl border border-amber-300 bg-white p-1" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Secondary color</label>
                      <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full h-11 rounded-xl border border-amber-300 bg-white p-1" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Accent color</label>
                      <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full h-11 rounded-xl border border-amber-300 bg-white p-1" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Brand tone</label>
                    <input
                      type="text"
                      value={brandTone}
                      onChange={(e) => setBrandTone(e.target.value)}
                      className="w-full mt-1 bg-white border border-amber-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900"
                      placeholder="e.g. Bold, premium, friendly, and trustworthy"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Logo Upload */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Step 3: Upload Brand Logo {manualEntryMode ? '(Required)' : '(Optional)'}</h2>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Upload a standalone logo file (.png, .svg, .jpg, max {MAX_IMG_SIZE_MB}MB). Manual onboarding requires at least one logo before save.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">Default Variant Role</label>
                <input
                  type="text"
                  placeholder="e.g. Primary Lockup, Icon-Only"
                  value={logoVariantLabel}
                  onChange={(e) => setLogoVariantLabel(e.target.value)}
                  className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900"
                />
              </div>

              <div
                className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-3xl p-6 text-center transition-all bg-[#FFFDF0] space-y-3 cursor-pointer"
                onClick={() => document.getElementById('logo-upload-input')?.click()}
              >
                <input
                  id="logo-upload-input"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <ImageIcon className="w-8 h-8 text-amber-600 mx-auto" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Upload standalone logos</p>
                  <p className="text-[10px] text-slate-600 font-medium">PNG, SVG, JPG up to {MAX_IMG_SIZE_MB}MB</p>
                </div>
              </div>

              {logoFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Selected Logos ({logoFiles.length}):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {logoFiles.map((file, i) => (
                      <div key={i} className="bg-[#FFFDF0] border border-amber-300 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button onClick={() => removeLogoFile(i)} className="text-slate-500 hover:text-rose-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Sample Copy and Restricted Rules */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Step 4: Voice Samples & Restricted Rules</h2>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {manualEntryMode
                    ? 'Manual onboarding requires at least two voice samples and one restricted-rule statement.'
                    : 'Paste approved marketing copy, headlines, or brand messaging. These will be indexed into 384-dimensional vector embeddings via MiniLM.'}
                </p>
              </div>

              {manualEntryMode && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Voice examples (minimum 2)</label>
                    <div className="space-y-2 mt-2">
                      {voiceExamples.map((sample, index) => (
                        <textarea
                          key={index}
                          rows={2}
                          value={sample}
                          onChange={(e) => {
                            const next = [...voiceExamples];
                            next[index] = e.target.value;
                            setVoiceExamples(next);
                          }}
                          placeholder={`Voice sample ${index + 1}`}
                          className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl p-3 text-xs font-bold text-slate-900 placeholder-slate-400"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setVoiceExamples((prev) => [...prev, ''])}
                      className="mt-2 text-[11px] font-bold text-amber-700 hover:text-amber-900"
                    >
                      + Add another voice sample
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Restricted rules</label>
                    <div className="space-y-2 mt-2">
                      {restrictedRules.map((rule, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={rule}
                            onChange={(e) => {
                              const next = [...restrictedRules];
                              next[index] = e.target.value;
                              setRestrictedRules(next);
                            }}
                            placeholder="e.g. Do not claim guaranteed outcomes"
                            className="flex-1 bg-[#FFFDF0] border border-amber-300 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400"
                          />
                          {restrictedRules.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setRestrictedRules((prev) => prev.filter((_, i) => i !== index))}
                              className="text-slate-500 hover:text-rose-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRestrictedRules((prev) => [...prev, ''])}
                      className="mt-2 text-[11px] font-bold text-amber-700 hover:text-amber-900"
                    >
                      + Add another rule
                    </button>
                  </div>
                </div>
              )}

              {!manualEntryMode && (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    placeholder="Paste examples of approved brand copy, email campaigns, taglines, or brand narrative paragraphs here..."
                    value={sampleCopyText}
                    onChange={(e) => setSampleCopyText(e.target.value)}
                    className="w-full bg-[#FFFDF0] border border-amber-300 rounded-2xl p-4 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans shadow-inner"
                  />
                  <p className="text-[11px] text-slate-600 font-medium">
                    Tip: Separate distinct voice examples with double line breaks.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Wizard Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-amber-100 mt-8">
            {currentStep > 1 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (currentStep === 1 && !brandName.trim()) {
                    setErrorMessage('Please enter a brand profile name.');
                    return;
                  }
                  setErrorMessage(null);
                  setCurrentStep((prev) => prev + 1);
                }}
                className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full px-6"
              >
                Next <ArrowRight className="w-3.5 h-3.5 ml-1 text-amber-400" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full px-8"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" /> Start Brand Ingestion Pipeline
              </Button>
            )}
          </div>

          {/* Submission progress overlay message */}
          {isSubmitting && submitProgress && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold text-center flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
              {submitProgress}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
