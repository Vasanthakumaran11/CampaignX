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
  X,
  Layers,
  FileCheck2,
  Cpu,
  Palette,
  Edit3,
  Sliders,
  CheckCircle,
  Eye,
  Award,
  Terminal,
  Lock,
  Compass,
  CheckCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-amber-400 selection:text-slate-950 font-sans scroll-smooth">
      {/* Top Header Navigation — Dark Theme */}
      <header className="sticky top-0 z-50 bg-[#0B1120] border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/CampaignX_icon.png"
                alt="CampaignX Logo"
                className="w-9 h-9 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-sans">
                  CampaignX <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 border border-amber-500">Studio</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 block -mt-1">
                  AI Marketing &amp; Brand Compliance
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-300">
              <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-amber-400 transition-colors">How it Works</a>
              <a href="#platform" className="hover:text-amber-400 transition-colors">Platform</a>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:block text-sm font-bold text-slate-300 hover:text-white transition-colors px-3 py-2"
              >
                Log in
              </Link>
              <Button
                variant="primary"
                onClick={() => navigate('/signup')}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-full px-6 py-2 shadow-md hover:shadow-lg transition-all cursor-pointer border border-amber-500"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Clean Neutral Background & Ambient Gold Glow */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-32 bg-gradient-to-b from-[#F1F5F9]/90 via-[#F8FAFC] to-[#F8FAFC] border-b border-slate-200/80">
        {/* Soft Ambient Radial Lighting */}
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute top-10 left-1/4 w-[600px] h-[500px] bg-gradient-to-tr from-amber-200/40 via-amber-100/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-[600px] h-[500px] bg-gradient-to-bl from-indigo-200/30 via-slate-200/40 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-5 space-y-7">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-amber-400 text-xs font-bold tracking-wide border border-slate-800 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Grounded GenAI Brand Studio
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
                  Bold Brands <br />
                  <span className="text-amber-500">Begin Here</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
                  Create marketing campaigns that stand out and stay strictly true to your brand. Generate, audit, and approve compliant content across all platforms.
                </p>
              </div>

              {/* Feature Pill Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> AI-Powered Generation
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Compliance Validation
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-bold text-slate-800">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" /> Smarter Decision KPIs
                </div>
              </div>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-[#0B1120] hover:bg-slate-800 text-white font-bold rounded-full px-8 py-3.5 text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  Get Started Free <ArrowRight className="w-5 h-5 text-amber-400" />
                </button>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-full px-7 py-3.5 text-base shadow-xs hover:shadow-md transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  Watch Demo <Play className="w-4 h-4 text-slate-900 fill-slate-900" />
                </button>
              </div>
            </div>

            {/* Hero Right 3D Application Format Interface */}
            <div className="lg:col-span-7 relative perspective-1200">
              <div className="relative w-full rounded-3xl preserve-3d rotate-3d-hero transition-transform duration-700 hover:rotate-0">
                
                {/* 3D Main Dark Studio Window Frame */}
                <div className="bg-[#0B1120] rounded-3xl border border-slate-700/80 shadow-2xl p-5 space-y-4 text-white glow-amber-lg relative overflow-hidden">
                  
                  {/* Window Top Controls Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/90" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/90" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/90" />
                      <span className="text-[11px] font-mono text-slate-400 ml-2 font-bold flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-amber-400" /> CampaignX Studio · Active Brand: <span className="text-amber-400">FutureReady Pro</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ● Local RAG Engine Active
                      </span>
                    </div>
                  </div>

                  {/* Window Content Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    
                    {/* Left Mini Column: Copy Variant Preview */}
                    <div className="sm:col-span-7 space-y-3">
                      
                      {/* Channel Tabs */}
                      <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-[10px] font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950">LinkedIn Post</span>
                        <span className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white">X / Twitter</span>
                        <span className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white">Instagram</span>
                        <span className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white">Email</span>
                      </div>

                      {/* Generated Copy Box */}
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 shadow-inner">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Grounded Headline #1
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                            98% Tone Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                          "Empower your engineering career with deterministic AI mastery. Experience verified skill growth with FutureReady Pro."
                        </p>

                        {/* Inline Tag verification list */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1">
                            <CheckCheck className="w-2.5 h-2.5" /> CTA Present
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1">
                            <CheckCheck className="w-2.5 h-2.5" /> 0 Prohibited Claims
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1">
                            <CheckCheck className="w-2.5 h-2.5" /> Approved Tone
                          </span>
                        </div>
                      </div>

                      {/* Action trigger row */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Palette className="w-3.5 h-3.5 text-amber-400" /> Palette:
                          <div className="flex items-center gap-1 pl-1">
                            <span className="w-3 h-3 rounded-full bg-[#0F172A] border border-slate-600" />
                            <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-slate-600" />
                            <span className="w-3 h-3 rounded-full bg-[#10B981] border border-slate-600" />
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> 1-Click Approved
                        </span>
                      </div>

                    </div>

                    {/* Right Mini Column: Visual Compliance Mockup Card */}
                    <div className="sm:col-span-5 space-y-3">
                      
                      {/* Visual Audit Preview Card */}
                      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-3 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-indigo-400" /> Poster Audit
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">YOLO + OpenCV</span>
                        </div>

                        {/* Simulated Poster Graphic with Bounding Box Overlay */}
                        <div className="relative h-28 rounded-xl overflow-hidden bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-2 flex flex-col justify-between shadow-md">
                          <div className="flex items-start justify-between">
                            <div className="p-1 rounded bg-black/60 backdrop-blur-xs border border-amber-300 text-[9px] font-mono font-bold text-white">
                              Logo Match: 99.4%
                            </div>
                            <span className="text-[8px] font-bold bg-white/90 text-slate-900 px-1.5 py-0.5 rounded">
                              Compliant
                            </span>
                          </div>
                          <p className="text-[11px] font-black text-slate-950 leading-tight drop-shadow-xs">
                            FutureReady AI Poster
                          </p>
                        </div>

                        {/* Vision Metrics breakdown */}
                        <div className="space-y-1 text-[10px] font-mono text-slate-400">
                          <div className="flex justify-between">
                            <span>Color Harmony</span>
                            <span className="text-emerald-400 font-bold">100% PASS</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Logo Safe Margin</span>
                            <span className="text-emerald-400 font-bold">VERIFIED</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

                {/* Floating 3D Badge 1: Compliance Donut Ring (Top Right) */}
                <div className="absolute -top-6 -right-6 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3.5 shadow-2xl border border-amber-400/40 animate-float-slow text-white z-20">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Audit Score</span>
                      <div className="text-2xl font-black text-white">98<span className="text-xs text-amber-400 font-normal">/100</span></div>
                    </div>
                    
                    {/* Ring Chart */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-800" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-amber-400" strokeDasharray="98, 100" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className="absolute text-[10px] font-black text-amber-400">98%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-bold mt-1">✓ Grade A+ Enterprise Passed</p>
                </div>

                {/* Floating 3D Badge 2: AI Suggestion Chip (Bottom Left) */}
                <div className="absolute -bottom-6 -left-6 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-slate-700 animate-float-delayed text-white z-20 max-w-[240px]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" /> AI Revision Engine
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-tight font-medium">
                    "Auto-shortened for 34% higher LinkedIn CTR compliance."
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 1: Features (5 Core Pillars) */}
      <section id="features" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Everything you need to create, verify and scale marketing content with <span className="text-amber-500">confidence</span>.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              A comprehensive GenAI workspace designed for modern marketing teams and brand custodians.
            </p>
          </div>

          {/* 5 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Card 1: Campaign Creation */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between hover:border-amber-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-900 flex items-center justify-center font-bold">
                  <Rocket className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-base font-black text-slate-900">Campaign Creation</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Generate platform-specific headlines, hooks, body copy, and social posts grounded in brand voice.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                Multi-Platform RAG <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            {/* Card 2: Brand Protection */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between hover:border-amber-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-900 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-base font-black text-slate-900">Brand Protection</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Automatically enforce negative terms, prohibited competitors, tone anchors, and regulatory mandates.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                Zero-Shot Validation <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            {/* Card 3: Compliance Check */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between hover:border-amber-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-900 flex items-center justify-center font-bold">
                  <Search className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-base font-black text-slate-900">Compliance Check</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Score marketing copy &amp; posters in real-time with granular flag explanations and inline highlighted snippets.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                Visual &amp; Copy Audits <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            {/* Card 4: Smart Insights */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between hover:border-amber-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-900 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-base font-black text-slate-900">Smart Insights</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Get actionable revision feedback and track channel performance metrics in an executive dashboard.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                KPI Analytics <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            {/* Card 5: Team Collaboration */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between hover:border-amber-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-900 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-base font-black text-slate-900">Human Approval</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Review, edit, bookmark finalists, and formally approve campaign deliverables into production records.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                Approval Workflow <ArrowRight className="w-3 h-3" />
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* Section 2: How it Works (4-Step Sequential Pipeline) */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-300">
              Simple 4-Step Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              From Raw Brand Guidelines to <span className="text-amber-500">Approved Campaigns</span> in Minutes
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              CampaignX AI automates the entire content lifecycle while keeping your team in complete control.
            </p>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm relative group hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 hover:border-amber-300">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-amber-400 font-mono">01</span>
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Ingest Brand Kit</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Upload your brand guidelines PDF. AI extracts primary &amp; accent hex palettes, official logos, negative terms, and vector tone embeddings.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Hex Palettes &amp; Rules
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Vector Tone Anchors
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm relative group hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 hover:border-amber-300">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-amber-400 font-mono">02</span>
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Configure Brief &amp; Personas</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Specify campaign goals, product features, and distribution channels (LinkedIn, X, Instagram, Email) with 1-click audience persona presets.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 8 Built-in Personas
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Multi-Channel Selection
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm relative group hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 hover:border-amber-300">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-amber-400 font-mono">03</span>
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Grounded Generation</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Retrieves top tone anchors via pgvector similarity to generate compliant copy variants, headlines, hooks, and branded visual posters.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> RAG Grounded Copy
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> AI Poster Generation
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm relative group hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 hover:border-amber-300">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-amber-400 font-mono">04</span>
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Audit &amp; Approve</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Instant multi-layer audit verifies claims, CTA presence, restricted words, and logo positioning. Revise with AI and mark as Approved.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Instant Score /100
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 1-Click Human Approval
                </div>
              </div>
            </div>

          </div>

          {/* Flow Callout Banner */}
          <div className="p-8 rounded-3xl bg-[#0B1120] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black flex-shrink-0 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black tracking-tight text-white">Ready to see it in action on your brand?</h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Create an account and ingest your first brand guideline kit in under 60 seconds.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-full px-7 py-3 text-xs shadow-md transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer border border-amber-500"
            >
              Start Free Workspace <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* Section 3: Platform Architecture & Capabilities */}
      <section id="platform" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Platform Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Enterprise Grade AI with <span className="text-indigo-600">Deterministic Safety</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              A hybrid system combining localized vector embedding retrieval, zero-shot NLI verification, and template-matching vision pipelines.
            </p>
          </div>

          {/* 3 Major Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1: Knowledge & Retrieval */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6 hover:shadow-lg transition-all hover:border-amber-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-900 flex items-center justify-center">
                <Layers className="w-6 h-6 text-amber-700" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">Brand Knowledge Base</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Maintains high-dimensional vector embeddings of approved voice samples using sentence transformers (`all-MiniLM-L6-v2`) and strict negative phrase dictionaries.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-bold text-slate-700 pt-2 border-t border-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" /> pgvector 384-dim semantic search
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" /> Automated color hex k-means extraction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" /> Multi-tenant workspace isolation
                </li>
              </ul>
            </div>

            {/* Pillar 2: Multi-Layer Compliance Engine */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6 hover:shadow-lg transition-all hover:border-emerald-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 text-emerald-900 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">Compliance Audit Engine</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Combines Zero-Shot Natural Language Inference (`valhalla/distilbart-mnli-12-3`) for claims auditing with deterministic regex scanning and CTA validation.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-bold text-slate-700 pt-2 border-t border-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Unsubstantiated claims detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Prohibited competitor mention blocker
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Mandatory disclaimer verification
                </li>
              </ul>
            </div>

            {/* Pillar 3: Visual & Vision Audit */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6 hover:shadow-lg transition-all hover:border-indigo-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-400/20 text-indigo-900 flex items-center justify-center">
                <Eye className="w-6 h-6 text-indigo-700" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">Visual Compliance Audit</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Two-stage computer vision pipeline leveraging YOLO brand logo detection with an OpenCV multi-scale normalized cross-correlation fallback.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-bold text-slate-700 pt-2 border-t border-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" /> Multi-scale template logo matcher
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" /> Hex palette color compliance scoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" /> Visual bounding box overlay visualizer
                </li>
              </ul>
            </div>

          </div>

          {/* Metric Stats Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-3xl bg-[#0B1120] border border-slate-800 shadow-xl text-center text-white">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">99.8%</span>
              <p className="text-xs font-bold text-slate-400">Brand Tone Consistency</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">&lt; 3.0s</span>
              <p className="text-xs font-bold text-slate-400">Audit Response Time</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">100%</span>
              <p className="text-xs font-bold text-slate-400">Policy-Grounded RAG</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">0</span>
              <p className="text-xs font-bold text-slate-400">Unverified Claims Leaked</p>
            </div>
          </div>

        </div>
      </section>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> CampaignX AI Live Product Tour
              </h3>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400 text-sm">Phase 1 — Brand Kit Ingestion &amp; Review Studio</h4>
                <p>Upload brand guidelines PDF, auto-extract colors (k-means), logos, and vector tone anchors (`all-MiniLM-L6-v2`).</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400 text-sm">Phase 2 — Grounded Copy Generation (RAG)</h4>
                <p>Retrieves top tone anchors via pgvector vector similarity and generates grounded copy variants across all platforms.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400 text-sm">Phase 3 — Text Compliance &amp; Audit Engine</h4>
                <p>Zero-shot NLI claims auditing (`valhalla/distilbart-mnli-12-3`), tone similarity scoring, and inline text highlighting.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400 text-sm">Phase 4 — Poster &amp; Visual Audit</h4>
                <p>Visual poster generator + computer vision template matching to detect logos, calculate color harmony, and verify brand safety.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  setShowDemoModal(false);
                  navigate('/signup');
                }}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-full px-6 border border-amber-500"
              >
                Start Free Workspace Now →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 bg-[#0B1120] border-t border-slate-800 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-slate-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-amber-400 transition-colors">How it Works</a>
            <a href="#platform" className="hover:text-amber-400 transition-colors">Platform</a>
            <Link to="/login" className="hover:text-amber-400 transition-colors">Log In</Link>
            <Link to="/signup" className="hover:text-amber-400 transition-colors">Sign Up Free</Link>
          </div>
          <p className="text-slate-500">CampaignX AI • Marketing Campaign &amp; Brand Compliance Studio • © 2026</p>
        </div>
      </footer>
    </div>
  );
};
