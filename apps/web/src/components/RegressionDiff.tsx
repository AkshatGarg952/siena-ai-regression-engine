import React, { useState } from 'react';
import { ComparisonReport, DiffType, SeverityLevel } from '@siena/shared';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cpu,
  Filter,
} from 'lucide-react';

interface RegressionDiffProps {
  report: ComparisonReport;
}

export const RegressionDiff: React.FC<RegressionDiffProps> = ({ report }) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'REGRESSIONS' | 'UNCHANGED'>('ALL');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = report.differences.filter((item) => {
    if (activeFilter === 'CRITICAL') return item.severity === 'CRITICAL';
    if (activeFilter === 'REGRESSIONS') return item.type === 'REGRESSION';
    if (activeFilter === 'UNCHANGED') return item.type === 'UNCHANGED';
    return true;
  });

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
            <ShieldAlert className="w-3 h-3 mr-1" />
            CRITICAL
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            LOW
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: DiffType) => {
    switch (type) {
      case 'REGRESSION':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white tracking-wide">
            REGRESSION
          </span>
        );
      case 'IMPROVEMENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white tracking-wide">
            IMPROVEMENT
          </span>
        );
      case 'NEW_FAILURE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            NEW FAILURE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">
            UNCHANGED
          </span>
        );
    }
  };

  const hasCritical = report.differences.some((d) => d.type === 'REGRESSION' && d.severity === 'CRITICAL');

  return (
    <div className="space-y-6">
      {/* Hero Regression Alert Banner */}
      {report.summary.totalRegressions > 0 ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-rose-900/30 to-slate-900/40 border border-rose-500/40 shadow-xl glow-rose">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mt-0.5">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    🚨 {report.summary.totalRegressions} REGRESSIONS DETECTED
                  </h3>
                  {hasCritical && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-500 text-white">
                      DEPLOYMENT BLOCKED
                    </span>
                  )}
                </div>
                <p className="text-sm text-rose-200/80 mt-1">
                  Candidate agent <span className="font-semibold text-white">[{report.targetRun.version}]</span> regressed behavioral policies compared to baseline <span className="font-semibold text-white">[{report.baseRun.version}]</span>. Pass rate dropped by {Math.abs(report.summary.passRateDelta)}%.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800 self-start sm:self-auto">
              <span className="text-emerald-400 font-bold">{report.baseRun.version}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-rose-400 font-bold">{report.targetRun.version}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-slate-900/40 border border-emerald-500/30 shadow-lg glow-emerald">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Zero Regressions Detected</h3>
              <p className="text-sm text-emerald-200/80">
                Candidate agent [{report.targetRun.version}] maintained or improved all policy behaviors. Safe for staging.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Scenarios ({report.differences.length})
          </button>
          <button
            onClick={() => setActiveFilter('REGRESSIONS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'REGRESSIONS'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Regressions ({report.summary.totalRegressions})
          </button>
          <button
            onClick={() => setActiveFilter('CRITICAL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Critical Only
          </button>
          <button
            onClick={() => setActiveFilter('UNCHANGED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'UNCHANGED'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Passing ({report.summary.totalUnchanged})
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Showing {filteredItems.length} scenario comparisons</span>
        </div>
      </div>

      {/* Scenario Differences List */}
      <div className="space-y-4">
        {filteredItems.map((item, index) => {
          const isExpanded = expandedItems[item.testCaseId] !== false; // Default expanded
          const isRegression = item.type === 'REGRESSION';

          return (
            <div
              key={item.testCaseId}
              className={`rounded-2xl border transition-all ${
                isRegression
                  ? 'border-rose-500/30 bg-slate-900/50 hover:border-rose-500/50'
                  : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => toggleExpand(item.testCaseId)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {item.type === 'REGRESSION' ? (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">#{index + 1}</span>
                      <h4 className="text-sm font-semibold text-white tracking-tight">
                        {item.testCaseName}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/60">
                        {item.category}
                      </span>
                      {getTypeBadge(item.type)}
                      {getSeverityBadge(item.severity)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono line-clamp-1">
                      "{item.input}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-auto">
                  {/* Status diff indicator */}
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${item.baseStatus === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'}`}>
                      {report.baseRun.version}: {item.baseStatus}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className={`px-2 py-0.5 rounded font-bold ${item.targetStatus === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'}`}>
                      {report.targetRun.version}: {item.targetStatus}
                    </span>
                  </div>

                  <button className="text-slate-400 hover:text-white p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Comparison Body */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-800/80 space-y-4">
                  {/* Failure Reason Alert */}
                  {item.reason && item.type !== 'UNCHANGED' && (
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-rose-200">Evaluation Root Cause: </span>
                        {item.reason}
                      </div>
                    </div>
                  )}

                  {/* Side-by-Side Version Diff */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Baseline Version (v1.0) */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Baseline: {report.baseRun.version}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400">
                          Policy: {(item.baseScores.policy * 100).toFixed(0)}%
                        </span>
                      </div>

                      {/* Tool Calls Trace */}
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Tool Invocations ({item.baseToolCalls.length})
                        </span>
                        {item.baseToolCalls.length === 0 ? (
                          <span className="text-xs text-slate-500 italic">No tools called</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.baseToolCalls.map((t, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              >
                                <Cpu className="w-3 h-3 mr-1 text-emerald-400" />
                                {t.tool}()
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Response snippet */}
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Agent Response
                        </span>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-sans">
                          {item.baseResponse}
                        </div>
                      </div>
                    </div>

                    {/* Candidate Version (v1.1) */}
                    <div className={`p-4 rounded-xl bg-slate-950/60 border ${isRegression ? 'border-rose-500/30' : 'border-slate-800'} space-y-3`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${isRegression ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Candidate: {report.targetRun.version}
                          </span>
                        </div>
                        <span className={`text-[11px] font-mono ${item.targetScores.policy < 0.5 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                          Policy: {(item.targetScores.policy * 100).toFixed(0)}%
                        </span>
                      </div>

                      {/* Tool Calls Trace */}
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Tool Invocations ({item.targetToolCalls.length})
                        </span>
                        {item.targetToolCalls.length === 0 ? (
                          <span className="text-xs text-slate-500 italic">No tools called</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.targetToolCalls.map((t, i) => {
                              const isForbidden = t.tool === 'issueRefund' && item.type === 'REGRESSION';
                              return (
                                <span
                                  key={i}
                                  className={`inline-flex items-center text-xs font-mono px-2 py-0.5 rounded ${
                                    isForbidden
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  <Cpu className="w-3 h-3 mr-1" />
                                  {t.tool}()
                                  {isForbidden && ' ⚠️'}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Response snippet */}
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Agent Response
                        </span>
                        <div className={`p-2.5 rounded-lg bg-slate-900 border ${isRegression ? 'border-rose-500/20 text-rose-200' : 'border-slate-800 text-slate-300'} text-xs font-sans`}>
                          {item.targetResponse}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
