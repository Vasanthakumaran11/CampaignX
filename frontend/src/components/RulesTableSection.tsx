import React, { useState } from 'react';
import { 
  MessageSquareQuote, 
  Image as ImageIcon, 
  Palette, 
  ShieldAlert, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  ExternalLink,
  BookOpen,
  Sparkles,
  ListFilter
} from 'lucide-react';
import { BrandGuidelineRule, RuleCategory } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { updateRuleCategory, updateRuleText, deleteRule } from '../services/api';

interface RulesTableSectionProps {
  profileId: string;
  rules: BrandGuidelineRule[];
  onRuleUpdated: (updatedRule: BrandGuidelineRule) => void;
  onRuleDeleted?: (deletedRuleId: string) => void;
}

interface CategoryConfig {
  key: RuleCategory;
  num: string;
  title: string;
  icon: React.ElementType;
  accentColor: string;
  badgeVariant: 'indigo' | 'warning' | 'success' | 'destructive' | 'secondary';
  bgClass: string;
  borderClass: string;
  textClass: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'tone',
    num: '#1',
    title: 'Tone of Voice',
    icon: MessageSquareQuote,
    accentColor: 'amber',
    badgeVariant: 'indigo',
    bgClass: 'bg-[#FFFDE8]',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-900',
  },
  {
    key: 'logo_usage',
    num: '#2',
    title: 'Logo Usage',
    icon: ImageIcon,
    accentColor: 'amber',
    badgeVariant: 'warning',
    bgClass: 'bg-[#FFFDE8]',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-900',
  },
  {
    key: 'color_usage',
    num: '#3',
    title: 'Color Palette Usage',
    icon: Palette,
    accentColor: 'emerald',
    badgeVariant: 'success',
    bgClass: 'bg-[#FFFDE8]',
    borderClass: 'border-amber-300',
    textClass: 'text-emerald-900',
  },
  {
    key: 'restricted_terms',
    num: '#4',
    title: 'Restricted Claims',
    icon: ShieldAlert,
    accentColor: 'rose',
    badgeVariant: 'destructive',
    bgClass: 'bg-[#FFFDE8]',
    borderClass: 'border-amber-300',
    textClass: 'text-rose-900',
  },
  {
    key: 'uncategorized',
    num: '#5',
    title: 'Uncategorized Rules',
    icon: HelpCircle,
    accentColor: 'slate',
    badgeVariant: 'secondary',
    bgClass: 'bg-[#FFFDE8]',
    borderClass: 'border-amber-300',
    textClass: 'text-slate-900',
  },
];

const CATEGORY_OPTIONS: { label: string; value: RuleCategory }[] = [
  { label: 'Tone of Voice', value: 'tone' },
  { label: 'Logo Usage', value: 'logo_usage' },
  { label: 'Color Palette Usage', value: 'color_usage' },
  { label: 'Restricted Claims', value: 'restricted_terms' },
  { label: 'Uncategorized', value: 'uncategorized' },
];

export const RulesTableSection: React.FC<RulesTableSectionProps> = ({
  profileId,
  rules,
  onRuleUpdated,
  onRuleDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'paragraph' | 'list'>('paragraph');

  // Collapse state per category card
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({
    tone: false,
    logo_usage: false,
    color_usage: false,
    restricted_terms: false,
    uncategorized: false,
  });

  // Drawer modal state for "+ X more — View all"
  const [drawerCategory, setDrawerCategory] = useState<CategoryConfig | null>(null);
  const [drawerSearch, setDrawerSearch] = useState<string>('');

  // Click-to-reveal edit state
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editCategoryText, setEditCategoryText] = useState<RuleCategory>('uncategorized');
  const [editRuleStatement, setEditRuleStatement] = useState<string>('');
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);

  const toggleCollapse = (catKey: string) => {
    setCollapsedMap((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const startEditRule = (rule: BrandGuidelineRule, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRuleId(rule.id);
    setEditCategoryText(rule.category);
    setEditRuleStatement(rule.rule_text);
  };

  const handleSaveRule = async (ruleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavingRuleId(ruleId);
    try {
      let updated: BrandGuidelineRule | null = null;
      updated = await updateRuleCategory(profileId, ruleId, editCategoryText);
      if (editRuleStatement.trim() !== updated.rule_text) {
        updated = await updateRuleText(profileId, ruleId, editRuleStatement.trim());
      }

      if (updated) {
        onRuleUpdated(updated);
      }
      setEditingRuleId(null);
    } catch (err) {
      console.error('Failed to update rule:', err);
    } finally {
      setSavingRuleId(null);
    }
  };

  const handleDeleteRule = async (ruleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this guideline rule?')) {
      return;
    }
    setSavingRuleId(ruleId);
    try {
      await deleteRule(profileId, ruleId);
      if (onRuleDeleted) {
        onRuleDeleted(ruleId);
      }
      setEditingRuleId(null);
    } catch (err) {
      console.error('Failed to delete rule:', err);
    } finally {
      setSavingRuleId(null);
    }
  };

  // Helper to render rules grouped into 2-3 readable paragraphs in solid black Times New Roman text (without bolding)
  const renderRulesAsParagraphs = (catRules: BrandGuidelineRule[], catTitle: string) => {
    if (catRules.length === 0) {
      return (
        <p className="text-xs text-slate-500 py-3 text-center italic font-medium">
          No rules extracted for {catTitle}.
        </p>
      );
    }

    // For card preview, limit chunk sizes if there are many rules (e.g. 88 Uncategorized Rules) to prevent long page scrolling
    const previewRules = catRules.slice(0, 15);
    const total = previewRules.length;
    const chunk1Size = Math.max(1, Math.ceil(total / 3));
    const chunk2Size = Math.max(1, Math.ceil((total - chunk1Size) / 2));

    const chunk1 = previewRules.slice(0, chunk1Size);
    const chunk2 = previewRules.slice(chunk1Size, chunk1Size + chunk2Size);
    const chunk3 = previewRules.slice(chunk1Size + chunk2Size);

    const p1Text = chunk1.map((r) => r.rule_text).join(' ');
    const p2Text = chunk2.map((r) => r.rule_text).join(' ');
    const p3Text = chunk3.map((r) => r.rule_text).join(' ');

    return (
      <div className="space-y-3">
        {p1Text && (
          <div className="bg-[#FFFDF0] p-4 rounded-2xl border border-amber-300 shadow-2xs space-y-1 max-h-48 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 block font-mono">
              Paragraph 1 — Core Brand Foundations & Principles
            </span>
            <p className="text-base font-normal text-black leading-relaxed" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {p1Text}
            </p>
          </div>
        )}

        {p2Text && (
          <div className="bg-[#FFFDF0] p-4 rounded-2xl border border-amber-300 shadow-2xs space-y-1 max-h-48 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 block font-mono">
              Paragraph 2 — Operational Standards & Execution
            </span>
            <p className="text-base font-normal text-black leading-relaxed" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {p2Text}
            </p>
          </div>
        )}

        {p3Text && (
          <div className="bg-[#FFFDF0] p-4 rounded-2xl border border-amber-300 shadow-2xs space-y-1 max-h-48 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 block font-mono">
              Paragraph 3 — Compliance Policies & Usage Guardrails
            </span>
            <p className="text-base font-normal text-black leading-relaxed" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {p3Text}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sticky Top Filter & Search Header */}
      <div className="sticky top-16 z-20 bg-[#FEFCE8]/95 backdrop-blur border-b border-amber-300 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              Extracted Guideline Rules
              <span className="text-xs font-mono font-bold bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-400">
                {rules.length} total
              </span>
            </h2>
            <p className="text-xs text-slate-700 font-bold">
              Formatted into 2-3 structured paragraphs per category with crystal-clear black text visibility.
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-amber-300 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('paragraph')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'paragraph'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-amber-100'
              }`}
            >
              Paragraph View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-amber-100'
              }`}
            >
              List View
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all guideline rules..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'all'
              ? 'bg-[#0F172A] text-white shadow-md'
              : 'bg-white text-slate-800 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          All Categories ({rules.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = rules.filter((r) => r.category === cat.key).length;
          const isActive = activeTab === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0F172A] text-white shadow-md'
                  : 'bg-white text-slate-800 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              {cat.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Responsive 2-Column Grouped Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORIES.map((catConfig) => {
          const catRules = rules.filter((r) => r.category === catConfig.key);
          const isCollapsed = collapsedMap[catConfig.key];
          const CategoryIcon = catConfig.icon;

          if (activeTab !== 'all' && activeTab !== catConfig.key) {
            return null;
          }
          if (searchQuery && catRules.length === 0) {
            return null;
          }

          const filteredRules = searchQuery
            ? catRules.filter((r) => r.rule_text.toLowerCase().includes(searchQuery.toLowerCase()))
            : catRules;

          return (
            <div
              key={catConfig.key}
              className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm ${catConfig.borderClass}`}
            >
              {/* Single-line Card Header */}
              <div
                onClick={() => toggleCollapse(catConfig.key)}
                className="px-5 py-4 border-b border-amber-200 flex items-center justify-between cursor-pointer select-none group bg-[#FFFDE8] rounded-t-3xl"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border ${catConfig.borderClass} ${catConfig.textClass} bg-amber-200`}
                  >
                    {catConfig.num}
                  </span>
                  <CategoryIcon className={`w-4 h-4 ${catConfig.textClass} shrink-0`} />
                  <h3 className="text-sm font-black text-slate-900 transition-colors">
                    {catConfig.title}{' '}
                    <span className="text-xs font-bold text-slate-600">({catRules.length})</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={catConfig.badgeVariant} className="text-[10px] font-bold">
                    {catConfig.key === 'uncategorized' ? 'Needs Review' : 'Categorized'}
                  </Badge>
                  <button className="text-slate-500 group-hover:text-slate-900 p-1 rounded hover:bg-amber-200/50">
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Card Body */}
              {!isCollapsed && (
                <div className="p-5">
                  {viewMode === 'paragraph' ? (
                    renderRulesAsParagraphs(filteredRules, catConfig.title)
                  ) : (
                    /* LIST VIEW WITH SOLID BLACK TEXT */
                    <div className="space-y-2">
                      {filteredRules.map((rule) => {
                        const isEditing = editingRuleId === rule.id;
                        return (
                          <div
                            key={rule.id}
                            onClick={(e) => !isEditing && startEditRule(rule, e)}
                            className={`rounded-2xl p-3.5 transition-all border ${
                              isEditing
                                ? 'bg-amber-50 border-amber-400 shadow-md'
                                : 'bg-[#FFFDF0] border-amber-300 hover:bg-amber-100/60 cursor-pointer'
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                    <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Edit Rule Statement
                                  </span>
                                  {rule.page_number && (
                                    <span className="text-[10px] font-mono bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold border border-amber-400">
                                      Page #{rule.page_number}
                                    </span>
                                  )}
                                </div>

                                <textarea
                                  rows={3}
                                  value={editRuleStatement}
                                  onChange={(e) => setEditRuleStatement(e.target.value)}
                                  className="w-full bg-white border border-amber-400 rounded-xl p-3 text-xs text-black font-bold leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                                />

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700">Reclassify:</span>
                                    <select
                                      value={editCategoryText}
                                      onChange={(e) => setEditCategoryText(e.target.value as RuleCategory)}
                                      className="bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    >
                                      {CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={(e) => handleDeleteRule(rule.id, e)}
                                      disabled={savingRuleId === rule.id}
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setEditingRuleId(null)}
                                    >
                                      <X className="w-3 h-3 mr-1" /> Cancel
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={(e) => handleSaveRule(rule.id, e)}
                                      isLoading={savingRuleId === rule.id}
                                    >
                                      <Check className="w-3 h-3 mr-1" /> Save
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3 group/row">
                                <div className="flex items-start gap-2.5 flex-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                                  <p className="text-base font-normal text-black leading-relaxed" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                    {rule.rule_text}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                  {rule.page_number && (
                                    <span className="text-[10px] font-mono text-amber-950 font-extrabold bg-amber-200 px-2 py-0.5 rounded border border-amber-300">
                                      p.{rule.page_number}
                                    </span>
                                  )}
                                  <Edit3 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Button to open full drawer */}
                  <button
                    onClick={() => {
                      setDrawerCategory(catConfig);
                      setDrawerSearch('');
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold text-amber-900 hover:text-slate-950 bg-amber-100/60 hover:bg-amber-200/80 rounded-xl transition-colors border border-amber-300 flex items-center justify-center gap-1.5 mt-4"
                  >
                    View & Manage All {catRules.length} Rules in Drawer
                    <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drawer Modal */}
      {drawerCategory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white border-l border-amber-300 h-full flex flex-col shadow-2xl">
            <div className="p-5 border-b border-amber-200 flex items-center justify-between bg-[#FFFDE8]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md">
                  <drawerCategory.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    {drawerCategory.title}
                    <Badge variant={drawerCategory.badgeVariant}>
                      {rules.filter((r) => r.category === drawerCategory.key).length} Items
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Complete extracted category list. Click any row to expand edit or reclassify.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrawerCategory(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-full hover:bg-amber-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-amber-200 bg-[#FFFDF0]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search rules inside ${drawerCategory.title}...`}
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {rules
                .filter(
                  (r) =>
                    r.category === drawerCategory.key &&
                    r.rule_text.toLowerCase().includes(drawerSearch.toLowerCase())
                )
                .map((rule) => {
                  const isEditing = editingRuleId === rule.id;

                  return (
                    <div
                      key={rule.id}
                      onClick={(e) => !isEditing && startEditRule(rule, e)}
                      className={`rounded-2xl p-4 transition-all border ${
                        isEditing
                          ? 'bg-amber-50 border-amber-400 shadow-md'
                          : 'bg-[#FFFDF0] border-amber-300 hover:bg-amber-100/60 cursor-pointer'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Edit Rule Statement
                            </span>
                            {rule.page_number && (
                              <span className="text-[10px] font-mono bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold border border-amber-400">
                                Page #{rule.page_number}
                              </span>
                            )}
                          </div>

                          <textarea
                            rows={3}
                            value={editRuleStatement}
                            onChange={(e) => setEditRuleStatement(e.target.value)}
                            className="w-full bg-white border border-amber-400 rounded-xl p-3 text-xs text-black font-bold leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                          />

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700">Reclassify:</span>
                              <select
                                value={editCategoryText}
                                onChange={(e) => setEditCategoryText(e.target.value as RuleCategory)}
                                className="bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              >
                                {CATEGORY_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={(e) => handleDeleteRule(rule.id, e)}
                                disabled={savingRuleId === rule.id}
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> Delete
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingRuleId(null)}
                              >
                                <X className="w-3 h-3 mr-1" /> Cancel
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => handleSaveRule(rule.id, e)}
                                isLoading={savingRuleId === rule.id}
                              >
                                <Check className="w-3 h-3 mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3 group/row">
                          <div className="flex items-start gap-2.5 flex-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                            <p className="text-base font-normal text-black leading-relaxed" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                              {rule.rule_text}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            {rule.page_number && (
                              <span className="text-[10px] font-mono text-amber-950 font-extrabold bg-amber-200 px-2 py-0.5 rounded border border-amber-300">
                                p.{rule.page_number}
                              </span>
                            )}
                            <Edit3 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
