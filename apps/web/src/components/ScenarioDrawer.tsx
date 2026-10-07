import React, { useState } from 'react';
import { TestCase } from '@siena/shared';
import { X, Layers, ShieldAlert, Wrench, UserCheck, AlertCircle } from 'lucide-react';

interface ScenarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: TestCase[];
}

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({ isOpen, onClose, scenarios }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All Scenarios', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'policy', label: 'Policy Adherence', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    { key: 'identity', label: 'Identity Verification', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { key: 'tool_usage', label: 'Tool Usage', icon: <Wrench className="w-3.5 h-3.5" /> },
    { key: 'adversarial', label: 'Adversarial & Bypass', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { key: 'edge_cases', label: 'Edge Cases', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  const filtered = selectedCategory === 'all'
    ? scenarios
    : scenarios.filter((s) => s.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Customer Support Test Suite</h2>
              <p className="text-xs text-slate-400">15 curated regression test scenarios across 5 categories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="p-4 border-b border-slate-800/80 flex flex-wrap gap-1.5 bg-slate-950/40">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === c.key
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {c.icon}
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Scenarios List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filtered.map((tc, idx) => (
            <div
              key={tc.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold">#{idx + 1}</span>
                  <h4 className="text-sm font-semibold text-white">{tc.name}</h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
                  {tc.category}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs font-mono text-slate-300">
                <span className="text-slate-500 select-none">&gt; </span>
                {tc.input}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                {tc.expectedBehavior.requiredTools && tc.expectedBehavior.requiredTools.length > 0 && (
                  <div>
                    <span className="text-slate-500">Required: </span>
                    <span className="text-emerald-400 font-mono">
                      {tc.expectedBehavior.requiredTools.join(', ')}
                    </span>
                  </div>
                )}
                {tc.expectedBehavior.forbiddenTools && tc.expectedBehavior.forbiddenTools.length > 0 && (
                  <div>
                    <span className="text-slate-500">Forbidden: </span>
                    <span className="text-rose-400 font-mono font-semibold">
                      {tc.expectedBehavior.forbiddenTools.join(', ')}
                    </span>
                  </div>
                )}
                {tc.expectedBehavior.expectedOutcome && (
                  <div>
                    <span className="text-slate-500">Outcome: </span>
                    <span className="text-blue-400 font-mono">
                      {tc.expectedBehavior.expectedOutcome}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
