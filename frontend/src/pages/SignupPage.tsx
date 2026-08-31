import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, AlertCircle,
  Sparkles, ArrowRight, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Validation helpers ────────────────────────────────────────
function validateFullName(v: string) {
  return v.trim().length >= 2;
}

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function getPasswordStrength(v: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (v.length === 0) return { level: 0, label: '', color: '' };
  if (v.length < 6) return { level: 1, label: 'Too short', color: 'bg-rose-500' };
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-rose-500' };
  if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
  return { level: 3, label: 'Strong', color: 'bg-emerald-500' };
}

function validatePassword(v: string) {
  return v.length >= 6;
}

function validateConfirmPassword(password: string, confirm: string) {
  return confirm === password && confirm.length > 0;
}

// ── Component ─────────────────────────────────────────────────
export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, confirmPassword: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pwStrength = getPasswordStrength(password);

  const errors = {
    fullName: touched.fullName && !validateFullName(fullName) ? 'Please enter your full name (at least 2 characters).' : null,
    email: touched.email && !validateEmail(email) ? 'Please enter a valid email address.' : null,
    password: touched.password && !validatePassword(password) ? 'Password must be at least 6 characters.' : null,
    confirmPassword: touched.confirmPassword && !validateConfirmPassword(password, confirmPassword)
      ? (confirmPassword.length === 0 ? 'Please confirm your password.' : 'Passwords do not match.')
      : null,
  };

  const isFormValid =
    validateFullName(fullName) &&
    validateEmail(email) &&
    validatePassword(password) &&
    validateConfirmPassword(password, confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    if (!isFormValid) return;

    setIsLoading(true);
    setServerError(null);

    await new Promise(r => setTimeout(r, 700));

    const result = signup(fullName, email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/brands', { replace: true });
    } else {
      setServerError(result.error || 'Sign up failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex flex-col lg:flex-row font-sans">
      {/* ── Left Brand Panel ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#0F172A] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-300/10 rounded-full blur-3xl" />
        </div>

        <Link to="/" className="relative flex items-center gap-3 w-fit group">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <span className="text-white font-extrabold text-xl tracking-tight block">CampaignX AI</span>
            <span className="text-amber-300/80 text-xs font-medium block -mt-0.5">Marketing & Compliance Studio</span>
          </div>
        </Link>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> FREE WORKSPACE
            </div>
            <h2 className="text-4xl font-black text-white leading-tight">
              Your brand.<br />
              <span className="text-amber-400">Your campaigns.</span><br />
              Fully compliant.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Set up your brand kit once and let CampaignX AI handle the rest — from copy generation to compliance checks.
            </p>
          </div>

          {/* What you get */}
          <div className="space-y-3">
            {[
              'Unlimited brand profiles & campaigns',
              'AI-powered copy generation (RAG)',
              'Visual poster compliance auditing',
              'Multi-platform content variants',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-600 text-xs font-mono">
          © 2026 CampaignX AI Studio · All rights reserved
        </p>
      </div>

      {/* ── Right Form Panel ─────────────────────────── */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-6 py-10 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg">CampaignX AI</span>
          </Link>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-slate-500 font-medium">
              Set up your free workspace in seconds. No credit card required.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="signup-fullname" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="signup-fullname"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setServerError(null); }}
                  onBlur={() => setTouched(t => ({ ...t, fullName: true }))}
                  placeholder="Aarav Sharma"
                  className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border text-sm font-medium text-slate-900 bg-white placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${
                    errors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 hover:border-amber-300'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setServerError(null); }}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border text-sm font-medium text-slate-900 bg-white placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${
                    errors.email ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 hover:border-amber-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setServerError(null); }}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  placeholder="Create a password"
                  className={`w-full pl-10 pr-12 py-3.5 rounded-2xl border text-sm font-medium text-slate-900 bg-white placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${
                    errors.password ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 hover:border-amber-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          i <= pwStrength.level ? pwStrength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  {pwStrength.label && (
                    <p className={`text-[11px] font-bold ${
                      pwStrength.level === 1 ? 'text-rose-600' :
                      pwStrength.level === 2 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {pwStrength.label} password
                      {pwStrength.level < 3 && ' — try adding uppercase letters, numbers or symbols.'}
                    </p>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="signup-confirm-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="signup-confirm-password"
                  type={showConfirmPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setServerError(null); }}
                  onBlur={() => setTouched(t => ({ ...t, confirmPassword: true }))}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-12 py-3.5 rounded-2xl border text-sm font-medium text-slate-900 bg-white placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${
                    errors.confirmPassword ? 'border-rose-400 bg-rose-50/50' :
                    touched.confirmPassword && validateConfirmPassword(password, confirmPassword) ? 'border-emerald-400 bg-emerald-50/30' :
                    'border-slate-200 hover:border-amber-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {touched.confirmPassword && validateConfirmPassword(password, confirmPassword) && (
                  <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating workspace...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Create Free Workspace
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-500 font-medium">Already have an account?</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 hover:text-amber-900 transition-colors hover:underline"
            >
              Sign in to your workspace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 font-medium">
            By creating an account, you agree to our{' '}
            <span className="text-amber-700 font-semibold cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-amber-700 font-semibold cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};
