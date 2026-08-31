import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Sparkles, Layers, ShieldCheck, BarChart2, Edit3,
  Wand2, LogOut, ChevronDown, User, Image as ImageIcon,
  FileText, Plus, Clock, ChevronRight
} from 'lucide-react';

// Auth
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { BrandListPage } from './pages/BrandListPage';
import { NewBrandWizardPage } from './pages/NewBrandWizardPage';
import { BrandDetailPage } from './pages/BrandDetailPage';
import { CampaignBriefWizardPage } from './pages/CampaignBriefWizardPage';
import { CampaignVariantsPage } from './pages/CampaignVariantsPage';
import { CampaignListPage } from './pages/CampaignListPage';
import { StandaloneAuditPage } from './pages/StandaloneAuditPage';
import { ComplianceHistoryPage } from './pages/ComplianceHistoryPage';
import { PosterGeneratorPage } from './pages/PosterGeneratorPage';
import { StandaloneVisualAuditPage } from './pages/StandaloneVisualAuditPage';
import { CampaignDashboardPage } from './pages/CampaignDashboardPage';
import { RevisionWorkspacePage } from './pages/RevisionWorkspacePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

// ─────────────────────────────────────────────────────────────────────────────
// User Dropdown Menu (Solid Dark Theme)
// ─────────────────────────────────────────────────────────────────────────────
const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#1E293B] hover:bg-[#334155] border border-slate-700 shadow-sm transition-all text-xs font-bold text-slate-100 focus:outline-none cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
          {initials}
        </div>
        <span className="hidden sm:inline-block font-semibold text-slate-100 text-xs max-w-[130px] truncate">
          {user?.fullName || 'My Account'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-amber-400' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-64 bg-[#0B1120] rounded-2xl shadow-2xl border border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-800 text-slate-200">
          {/* User profile card */}
          <div className="px-4 py-3 bg-[#030712] rounded-t-2xl">
            <p className="text-xs font-black text-white leading-tight">{user?.fullName}</p>
            <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              ● Active Workspace
            </span>
          </div>

          <div className="py-1">
            <button
              onClick={() => { navigate('/brands'); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-[#1E293B] hover:text-amber-400 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-400" /> My Brand Kits
            </button>
            <button
              onClick={() => { navigate('/brands/new'); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-[#1E293B] hover:text-amber-400 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Ingest New Brand Kit
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => { logout(); navigate('/login'); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Studio Tools Dropdown (Solid Dark Theme)
// ─────────────────────────────────────────────────────────────────────────────
const StudioToolsDropdown: React.FC<{ brandProfileId: string | null }> = ({ brandProfileId }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tools = brandProfileId ? [
    { label: 'Overview Dashboard', path: `/brands/${brandProfileId}/dashboard`, icon: BarChart2, desc: 'KPI metrics & score trends' },
    { label: 'Brand Kit Assets', path: `/brands/${brandProfileId}`, icon: Layers, desc: 'Colors, logos, rules & voice' },
    { label: 'Generate Copy (RAG)', path: `/brands/${brandProfileId}/campaigns/new`, icon: Wand2, desc: 'Multi-channel grounded copy' },
    { label: 'Campaign Briefs', path: `/brands/${brandProfileId}/campaigns`, icon: FileText, desc: 'View all generated variants' },
    { label: 'Copy Compliance Audit', path: `/brands/${brandProfileId}/compliance/audit`, icon: ShieldCheck, desc: 'Claims & tone validation' },
    { label: 'Revision Workspace', path: `/brands/${brandProfileId}/revision`, icon: Edit3, desc: 'Interactive copy editor' },
    { label: 'Poster Visual Audit', path: `/brands/${brandProfileId}/visual-compliance/audit`, icon: ImageIcon, desc: 'Logo & color compliance' },
    { label: 'Audit History', path: `/brands/${brandProfileId}/compliance/audits`, icon: Clock, desc: 'Historical compliance logs' },
  ] : [];

  const isToolsActive = brandProfileId && (
    location.pathname.includes('/dashboard') ||
    location.pathname.includes('/campaigns') ||
    location.pathname.includes('/compliance') ||
    location.pathname.includes('/revision') ||
    location.pathname.includes('/visual-compliance')
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          if (!brandProfileId) {
            navigate('/brands');
          } else {
            setOpen(o => !o);
          }
        }}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
          isToolsActive
            ? 'bg-amber-400 text-slate-950 shadow-xs font-extrabold'
            : 'text-slate-200 hover:text-white hover:bg-[#1E293B]'
        }`}
      >
        <Sparkles className={`w-3.5 h-3.5 ${isToolsActive ? 'text-slate-950' : 'text-amber-400'}`} />
        <span>Studio Tools</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && brandProfileId && (
        <div className="absolute left-0 mt-2.5 w-80 bg-[#0B1120] rounded-2xl shadow-2xl border border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 grid grid-cols-1 gap-1 text-slate-200">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
            Brand Workspace Tools
          </div>
          {tools.map(tool => {
            const Icon = tool.icon;
            const active = location.pathname === tool.path || (tool.path.endsWith('/campaigns') && location.pathname === tool.path);
            return (
              <Link
                key={tool.path}
                to={tool.path}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'hover:bg-[#1E293B] hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${active ? 'bg-slate-950 text-amber-400' : 'bg-[#1E293B] text-amber-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold leading-tight ${active ? 'text-slate-950' : 'text-white'}`}>{tool.label}</p>
                  <p className={`text-[11px] leading-tight truncate mt-0.5 ${active ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{tool.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Single, Clean, Professional Dark Navbar (3-4 Options Only)
// ─────────────────────────────────────────────────────────────────────────────
const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const hiddenRoutes = ['/', '/login', '/signup'];

  if (hiddenRoutes.includes(location.pathname)) return null;
  if (!isAuthenticated) return null;

  // Extract active brand profile ID if inside a brand workspace
  const brandMatch = location.pathname.match(/^\/brands\/([^/]+)/);
  const brandProfileId = brandMatch && brandMatch[1] !== 'new' ? brandMatch[1] : null;

  return (
    <header className="sticky top-0 z-50 bg-[#0B1120] text-slate-100 border-b border-slate-800 shadow-md h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4">
          
          {/* 1. Left: Brand Logo & Context Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/brands" className="flex items-center gap-2.5 group flex-shrink-0">
              <img
                src="/CampaignX_icon.png"
                alt="CampaignX AI"
                className="w-8 h-8 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5 font-sans">
                CampaignX <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 border border-amber-500">Studio</span>
              </span>
            </Link>

            {brandProfileId && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <Link
                  to={`/brands/${brandProfileId}`}
                  className="text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full hover:bg-amber-400/20 transition-all truncate max-w-[140px]"
                >
                  Active Workspace
                </Link>
              </div>
            )}
          </div>

          {/* 2. Center: Clean 3-Option Navigation Bar */}
          <nav className="hidden sm:flex items-center gap-2">
            {/* Option 1: Brand Kits */}
            <Link
              to="/brands"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/brands'
                  ? 'bg-amber-400 text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-200 hover:text-white hover:bg-[#1E293B]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Brand Kits</span>
            </Link>

            {/* Option 2: Studio Tools Dropdown */}
            <StudioToolsDropdown brandProfileId={brandProfileId} />

            {/* Option 3: Ingest New Kit */}
            <Link
              to="/brands/new"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/brands/new'
                  ? 'bg-amber-400 text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-200 hover:text-white hover:bg-[#1E293B]'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>New Brand Kit</span>
            </Link>
          </nav>

          {/* 3. Right: Quick Action CTA & User Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => {
                if (brandProfileId) {
                  navigate(`/brands/${brandProfileId}/campaigns/new`);
                } else {
                  navigate('/brands/new');
                }
              }}
              className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-sm transition-all cursor-pointer border border-amber-500"
            >
              <Wand2 className="w-3.5 h-3.5 text-slate-950" />
              <span>{brandProfileId ? 'Create Campaign' : 'Ingest Brand'}</span>
            </button>

            <UserMenu />
          </div>

        </div>
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Root Application
// ─────────────────────────────────────────────────────────────────────────────
export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
            <Navigation />
            <main className="flex-1">
              <Routes>
                {/* ── Public Routes ─────────────────────────── */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* ── Protected Workspace Routes ────────────── */}
                <Route path="/brands" element={<ProtectedRoute><BrandListPage /></ProtectedRoute>} />
                <Route path="/brands/new" element={<ProtectedRoute><NewBrandWizardPage /></ProtectedRoute>} />
                <Route path="/brands/:id" element={<ProtectedRoute><BrandDetailPage /></ProtectedRoute>} />
                <Route path="/brands/:brandProfileId/dashboard" element={<ProtectedRoute><CampaignDashboardPage /></ProtectedRoute>} />
                <Route path="/brands/:brandProfileId/campaigns/new" element={<ProtectedRoute><CampaignBriefWizardPage /></ProtectedRoute>} />
                <Route path="/brands/:brandProfileId/campaigns/:briefId" element={<ProtectedRoute><CampaignVariantsPage /></ProtectedRoute>} />
                <Route path="/brands/:brandProfileId/campaigns/:briefId/poster" element={<ProtectedRoute><PosterGeneratorPage /></ProtectedRoute>} />
                <Route path="/brands/:brandProfileId/campaigns" element={<ProtectedRoute><CampaignListPage /></ProtectedRoute>} />
                <Route path="/brands/:brandProfileId/compliance/audit" element={<ProtectedRoute><StandaloneAuditPage /></ProtectedRoute>} />
                <Route path="/brands/:brandProfileId/compliance/audits" element={<ProtectedRoute><ComplianceHistoryPage /></ProtectedRoute>} />
                <Route path="/brands/:brandProfileId/revision" element={<ProtectedRoute><RevisionWorkspacePage /></ProtectedRoute>} />
                <Route path="/brands/:brandProfileId/visual-compliance/audit" element={<ProtectedRoute><StandaloneVisualAuditPage /></ProtectedRoute>} />

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
