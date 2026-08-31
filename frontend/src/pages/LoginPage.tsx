import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Validation ────────────────────────────────────────────────
function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function validatePassword(v: string) {
  return v.length >= 6;
}

// ── Component ─────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/brands';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Field-level errors (only shown after blur)
  const errors = {
    email: touched.email && !validateEmail(email) ? 'Please enter a valid email address.' : null,
    password: touched.password && !validatePassword(password) ? 'Password must be at least 6 characters.' : null,
  };

  const isFormValid = validateEmail(email) && validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isFormValid) return;

    setIsLoading(true);
    setServerError(null);

    // Small artificial delay for UX polish
    await new Promise(r => setTimeout(r, 600));

    const result = login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setServerError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex flex-col lg:flex-row font-sans">
      {/* ── Left Brand Panel ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#0F172A] relative overflow-hidden flex-col justify-between p-12">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-300/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl" />
        </div>

        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-3 w-fit group">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <span className="text-white font-extrabold text-xl tracking-tight block">CampaignX AI</span>
            <span className="text-amber-300/80 text-xs font-medium block -mt-0.5">Marketing & Compliance Studio</span>
          </div>
        </Link>

        {/* Centered Marketing Copy */}
        <div className="relative space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> AI-POWERED COMPLIANCE
            </div>
            <h2 className="text-4xl font-black text-white leading-tight">
              Generate. Audit.<br />
              <span className="text-amber-400">Approve.</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Create brand-compliant marketing campaigns across every channel. Enforce brand guidelines automatically.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: '✦', text: 'RAG-powered content generation' },
              { icon: '✦', text: 'Visual & text compliance audits' },
              { icon: '✦', text: 'Multi-platform campaign variants' },
              { icon: '✦', text: 'Human approval workflow' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-amber-400 text-xs font-black">{f.icon}</span>
                <span className="text-slate-300 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative text-slate-600 text-xs font-mono">
          © 2026 CampaignX AI Studio · All rights reserved
        </p>
      </div>

      {/* ── Right Form Panel ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg">CampaignX AI</span>
          </Link>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-500 font-medium">
              Sign in to your workspace to continue building campaigns.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="login-email"
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
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setServerError(null); }}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3.5 rounded-2xl border text-sm font-medium text-slate-900 bg-white placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${
                    errors.password ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 hover:border-amber-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.password}
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
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Workspace
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">New to CampaignX?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Signup Link */}
          <Link
            to="/signup"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-sm transition-all shadow-sm hover:shadow group"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            Create your free account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <p className="text-center text-xs text-slate-400 font-medium">
            By continuing, you agree to the{' '}
            <span className="text-amber-700 font-semibold cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-amber-700 font-semibold cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};
