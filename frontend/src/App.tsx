import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sparkles, Layers, ShieldCheck, Zap } from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { BrandListPage } from './pages/BrandListPage';
import { NewBrandWizardPage } from './pages/NewBrandWizardPage';
import { BrandDetailPage } from './pages/BrandDetailPage';
import { CampaignBriefWizardPage } from './pages/CampaignBriefWizardPage';
import { CampaignVariantsPage } from './pages/CampaignVariantsPage';
import { CampaignListPage } from './pages/CampaignListPage';
import { StandaloneAuditPage } from './pages/StandaloneAuditPage';
import { ComplianceHistoryPage } from './pages/ComplianceHistoryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Navigation: React.FC = () => {
  const location = useLocation();

  // Hide top app header on landing page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FEFCE8]/95 backdrop-blur-md border-b border-amber-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform font-black">
              ⚡
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
                CampaignX AI <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">Studio</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/brands"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/brands') && location.pathname !== '/brands/new'
                  ? 'bg-amber-400/30 text-amber-950 border border-amber-400/50'
                  : 'text-slate-700 hover:text-amber-900 hover:bg-amber-100/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Brand Kits
            </Link>
            <Link
              to="/brands/new"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                location.pathname === '/brands/new'
                  ? 'bg-amber-400/30 text-amber-950 border border-amber-400/50'
                  : 'text-slate-700 hover:text-amber-900 hover:bg-amber-100/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Ingest New Kit
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#FFFDF0] text-[#0F172A]">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/brands" element={<BrandListPage />} />
              <Route path="/brands/new" element={<NewBrandWizardPage />} />
              <Route path="/brands/:id" element={<BrandDetailPage />} />
              <Route path="/brands/:brandProfileId/campaigns/new" element={<CampaignBriefWizardPage />} />
              <Route path="/brands/:brandProfileId/campaigns/:briefId" element={<CampaignVariantsPage />} />
              <Route path="/brands/:brandProfileId/campaigns" element={<CampaignListPage />} />
              <Route path="/brands/:brandProfileId/compliance/audit" element={<StandaloneAuditPage />} />
              <Route path="/brands/:brandProfileId/compliance/audits" element={<ComplianceHistoryPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
