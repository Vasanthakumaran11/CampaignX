import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sparkles, Layers, BookOpen, ShieldCheck, Activity } from 'lucide-react';
import { BrandListPage } from './pages/BrandListPage';
import { NewBrandWizardPage } from './pages/NewBrandWizardPage';
import { BrandDetailPage } from './pages/BrandDetailPage';

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

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/brands" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                CampaignX <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">Studio</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Brand Kit Ingestion & Compliance Engine
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/brands"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                location.pathname === '/brands' || location.pathname === '/'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Brand Kits
            </Link>
            <Link
              to="/brands/new"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                location.pathname === '/brands/new'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<BrandListPage />} />
              <Route path="/brands" element={<BrandListPage />} />
              <Route path="/brands/new" element={<NewBrandWizardPage />} />
              <Route path="/brands/:id" element={<BrandDetailPage />} />
            </Routes>
          </main>
          <footer className="py-6 border-t border-slate-800/60 text-center text-xs text-slate-500">
            CampaignX AI Marketing Studio • Phase 1: Foundation & Ingestion
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
