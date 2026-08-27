import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  BarChart3, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Rocket, 
  Shield, 
  Search, 
  TrendingUp, 
  Users,
  Instagram,
  Check,
  Zap,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#FFFDF0] text-[#0F172A] selection:bg-amber-300 selection:text-amber-950 font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#FEFCE8]/90 backdrop-blur-md border-b border-amber-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform font-black">
                <span className="text-xl font-mono">⚡</span>
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
                  CampaignX AI
                </span>
                <span className="text-[11px] font-medium text-slate-500 block -mt-1">
                  AI Marketing & Compliance Studio
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
              <a href="#features" className="hover:text-amber-600 transition-colors">Product</a>
              <a href="#features" className="hover:text-amber-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-amber-600 transition-colors">How it Works</a>
              <a href="#pricing" className="hover:text-amber-600 transition-colors">Pricing</a>
              <a href="#resources" className="hover:text-amber-600 transition-colors">Resources</a>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-4">
              <Link to="/brands" className="hidden sm:block text-sm font-bold text-slate-800 hover:text-amber-600 transition-colors">
                Log in
              </Link>
              <Button
                variant="primary"
                onClick={() => navigate('/brands')}
                className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full px-6 py-2.5 shadow-md hover:shadow-lg transition-all"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Golden Sunset Background */}
      <section className="relative overflow-hidden pt-8 pb-20 lg:pt-14 lg:pb-32 bg-gradient-to-b from-[#FEFCE8] via-[#FFFBEB] to-[#FEF08A]/40">
        {/* Background Decorative Scenic Art / Gradient Glow */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply">
          <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-amber-300 via-amber-200 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-[600px] h-[500px] bg-gradient-to-tr from-yellow-300 via-amber-100 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-950 tracking-tight leading-[1.08]">
                  Bold Brands <br />
                  <span className="text-slate-900">Begin Here</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-700 font-medium max-w-lg leading-relaxed">
                  Create marketing campaigns that stand out and stay true to your brand.
                </p>
              </div>

              {/* Feature Pill Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-full bg-[#FEFCE8] border border-amber-300/80 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> AI-Powered Campaign Generation
                </div>
                <div className="px-4 py-2 rounded-full bg-[#FEFCE8] border border-amber-300/80 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Brand & Compliance Validation
                </div>
                <div className="px-4 py-2 rounded-full bg-[#FEFCE8] border border-amber-300/80 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-800">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-600" /> Smarter Decisions Better Results
                </div>
              </div>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/brands')}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-full px-8 py-4 text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  Get Started Free <ArrowRight className="w-5 h-5 text-amber-400" />
                </button>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="bg-white/80 hover:bg-white text-slate-800 border border-slate-300 font-bold rounded-full px-7 py-4 text-base shadow-sm hover:shadow-md transition-all flex items-center gap-2.5"
                >
                  Watch Demo <Play className="w-4 h-4 text-slate-900 fill-slate-900" />
                </button>
              </div>
            </div>

            {/* Hero Right Visual Showcase (Floating 3D UI Cards) */}
            <div className="lg:col-span-6 relative">
              {/* Main Mountain Art / Backdrop Container */}
              <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60 bg-gradient-to-tr from-amber-400/20 via-amber-200/40 to-yellow-100 p-2">
                <img
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
                  alt="Mountain Hiker Sunset"
                  className="w-full h-[520px] object-cover rounded-2xl filter brightness-90 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-amber-400/20 rounded-2xl pointer-events-none" />

                {/* Floating Card 1: Compliance Score (Top Right) */}
                <div className="absolute top-6 right-6 w-80 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-amber-200 animate-float-slow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Compliance Score</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">94%</span>
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">↑ 12% vs last month</span>
                      </div>
                    </div>

                    {/* Ring Chart */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500"
                          strokeDasharray="94, 100"
                          strokeWidth="4"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Metrics Breakdown Bars */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex justify-between items-center font-bold text-slate-700">
                      <span>Brand Alignment</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '96%' }} />
                        </div>
                        <span>96%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-700">
                      <span>Tone Consistency</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '93%' }} />
                        </div>
                        <span>93%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-700">
                      <span>Claim Validation</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '89%' }} />
                        </div>
                        <span>89%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 2: AI Campaign Preview (Middle Left Dark Card) */}
                <div className="absolute top-44 left-4 w-72 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 text-white shadow-2xl border border-slate-800 animate-float-delayed">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-bold text-slate-300">AI Campaign Preview</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                      <Instagram className="w-2.5 h-2.5" /> Instagram Post
                    </span>
                  </div>

                  <div className="flex gap-3 items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <img
                      src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80"
                      alt="Headphones Creative"
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                    <div className="text-[11px] space-y-1">
                      <p className="font-semibold text-slate-200 leading-tight">
                        Experience next-level sound with TechNova Pulse. Built for those who live in the moment.
                      </p>
                      <p className="text-amber-400 font-mono font-bold text-[10px]">#FeelThePulse</p>
                    </div>
                  </div>
                </div>

                {/* Floating Card 3: Brand Rules (Middle Right Yellow Card) */}
                <div className="absolute bottom-24 right-4 w-60 bg-[#FEF08A] backdrop-blur-md rounded-2xl p-3.5 text-slate-950 shadow-2xl border border-amber-300">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 block mb-2">Brand Rules</span>
                  <ul className="space-y-1.5 text-xs font-bold text-slate-900">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 fill-slate-950 stroke-amber-300" /> No exaggerated claims
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 fill-slate-950 stroke-amber-300" /> Avoid prohibited words
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 fill-slate-950 stroke-amber-300" /> Maintain brand tone
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 fill-slate-950 stroke-amber-300" /> Use approved CTAs
                    </li>
                  </ul>
                </div>

                {/* Floating Card 4: AI Suggestions (Bottom Right) */}
                <div className="absolute bottom-4 left-1/3 w-64 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-amber-200">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Suggestions
                  </span>
                  <p className="text-xs text-slate-600 font-medium mb-2 leading-relaxed">
                    Consider adding a question to increase engagement by up to 28%.
                  </p>
                  <button
                    onClick={() => navigate('/brands')}
                    className="w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                  >
                    Apply Suggestion
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 2: 5-Card Feature Grid */}
      <section id="features" className="py-20 bg-white border-t border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Everything you need to create, verify and scale marketing content with <span className="text-amber-500 underline decoration-amber-300 underline-offset-4">confidence</span>.
            </h2>
          </div>

          {/* 5 Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Card 1: Campaign Creation */}
            <div className="bg-[#FFFDE8] border border-amber-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
              
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">Campaign Creation</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Generate platform-specific campaigns in seconds using advanced AI.
                </p>
              </div>
            </div>

            {/* Card 2: Brand Protection */}
            <div className="bg-[#FFFDE8] border border-amber-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
              
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">Brand Protection</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Ensure every piece of content follows your brand guidelines and policies.
                </p>
              </div>
            </div>

            {/* Card 3: Compliance Check */}
            <div className="bg-[#FFFDE8] border border-amber-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
              
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">Compliance Check</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Detect risky claims, forbidden words, and policy violations automatically.
                </p>
              </div>
            </div>

            {/* Card 4: Smart Insights */}
            <div className="bg-[#FFFDE8] border border-amber-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
              
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">Smart Insights</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Get actionable AI Insights to improve performance and consistency.
                </p>
              </div>
            </div>

            {/* Card 5: Team Collaboration */}
            <div className="bg-[#FFFDE8] border border-amber-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
              
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">Team Collaboration</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Review, approve and manage campaigns together with your team.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-amber-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> CampaignX AI Live Product Tour
              </h3>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Phase 1 — Brand Kit Ingestion & Review Studio</h4>
                <p>Upload brand guidelines PDF, auto-extract colors (k-means), logos, and vector tone anchors (`all-MiniLM-L6-v2`).</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Phase 2 — Grounded Copy Generation (RAG)</h4>
                <p>Retrieves top-5 tone anchors via pgvector vector similarity and generates grounded copy variants using Gemini Flash API.</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Phase 3 — Text Compliance & Audit Engine</h4>
                <p>Zero-shot NLI claims auditing (`valhalla/distilbart-mnli-12-3`), tone similarity scoring, and inline text highlighting.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  setShowDemoModal(false);
                  navigate('/brands');
                }}
                className="bg-[#0F172A] text-white font-bold rounded-full px-6"
              >
                Explore Live Studio Now →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 bg-[#FEFCE8] border-t border-amber-200 text-center text-xs text-slate-500 font-medium">
        CampaignX AI • Marketing Campaign & Brand Compliance Studio
      </footer>
    </div>
  );
};
