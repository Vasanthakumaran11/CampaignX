import React, { useState } from 'react';
import { BookOpen, Filter, Search, Tag } from 'lucide-react';
import { BrandGuidelineRule, RuleCategory } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { updateRuleCategory } from '../services/api';

interface RulesTableSectionProps {
  profileId: string;
  rules: BrandGuidelineRule[];
  onRuleUpdated: (updatedRule: BrandGuidelineRule) => void;
}

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: 'All Rules', value: 'all' },
  { label: 'Tone of Voice', value: 'tone' },
  { label: 'Logo Usage', value: 'logo_usage' },
  { label: 'Color Usage', value: 'color_usage' },
  { label: 'Restricted Claims', value: 'restricted_terms' },
  { label: 'Uncategorized', value: 'uncategorized' },
];

const CATEGORY_OPTIONS: { label: string; value: RuleCategory }[] = [
  { label: 'Tone', value: 'tone' },
  { label: 'Logo Usage', value: 'logo_usage' },
  { label: 'Color Usage', value: 'color_usage' },
  { label: 'Restricted Terms', value: 'restricted_terms' },
  { label: 'Uncategorized', value: 'uncategorized' },
];

export const RulesTableSection: React.FC<RulesTableSectionProps> = ({
  profileId,
  rules,
  onRuleUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleCategoryChange = async (ruleId: string, newCategory: RuleCategory) => {
    setUpdatingId(ruleId);
    try {
      const updated = await updateRuleCategory(profileId, ruleId, newCategory);
      onRuleUpdated(updated);
    } catch (err) {
      console.error('Failed to update rule category:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesTab = activeTab === 'all' || r.category === activeTab;
    const matchesSearch = r.rule_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getCategoryBadgeVariant = (cat: RuleCategory) => {
    switch (cat) {
      case 'tone':
        return 'indigo';
      case 'logo_usage':
        return 'warning';
      case 'color_usage':
        return 'success';
      case 'restricted_terms':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="border-indigo-500/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Extracted Guideline Rules ({rules.length})
            </CardTitle>
            <CardDescription>
              Heuristic-classified compliance rules extracted per page. Reclassify or filter as needed.
            </CardDescription>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search extracted rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.value === 'all'
                ? rules.length
                : rules.filter((r) => r.category === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.value
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.value
                      ? 'bg-indigo-500/30 text-indigo-200'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        {filteredRules.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {rules.length === 0
              ? 'No rules extracted yet. Upload a brand guideline PDF to begin extraction.'
              : 'No rules match your active filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 w-16 text-center">Page</th>
                  <th className="py-2.5 px-3">Extracted Rule Statement</th>
                  <th className="py-2.5 px-3 w-48">Classification Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="py-3 px-3 text-center align-top">
                      {rule.page_number ? (
                        <span className="font-mono text-[11px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          p. {rule.page_number}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-200 align-top leading-relaxed font-normal">
                      {rule.rule_text}
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="flex flex-col gap-1.5">
                        <Badge variant={getCategoryBadgeVariant(rule.category)}>
                          {rule.category.replace('_', ' ')}
                        </Badge>
                        <select
                          value={rule.category}
                          onChange={(e) =>
                            handleCategoryChange(rule.id, e.target.value as RuleCategory)
                          }
                          disabled={updatingId === rule.id}
                          className="bg-slate-950/80 border border-slate-700/80 rounded text-[11px] text-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              Reclassify: {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
