import React from 'react';
import { Database, Cpu, Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenScenarios: () => void;
  scenarioCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenScenarios, scenarioCount }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white tracking-tight text-lg">Siena AI</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                CI Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">Agent Regression & Behavioral Evaluation Platform</p>
          </div>
        </div>

        {/* Tech Stack Indicators */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API: Express + TS</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Redis + BullMQ</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>PostgreSQL</span>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenScenarios}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{scenarioCount} Scenarios</span>
          </button>
        </div>
      </div>
    </header>
  );
};
