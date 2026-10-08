import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricCard } from './components/MetricCard';
import { RegressionDiff } from './components/RegressionDiff';
import { ScenarioDrawer } from './components/ScenarioDrawer';
import { apiClient } from './api/client';
import { AgentVersion, TestCase, TestRun, ComparisonReport } from './types';
import {
  Play,
  Sparkles,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Scale,
  Clock,
  TrendingDown,
} from 'lucide-react';

export const App: React.FC = () => {
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [comparisonReport, setComparisonReport] = useState<ComparisonReport | null>(null);

  const [activeTab, setActiveTab] = useState<'COMPARISON' | 'RUNS' | 'VERSIONS'>('COMPARISON');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runningMessage, setRunningMessage] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fetchedAgents, fetchedCases, fetchedRuns] = await Promise.all([
        apiClient.getAgents(),
        apiClient.getTestCases(),
        apiClient.getTestRuns(),
      ]);

      setTestCases(fetchedCases);
      setTestRuns(fetchedRuns);

      if (fetchedAgents.length > 0) {
        const agent = fetchedAgents[0];
        const vers = await apiClient.getAgentVersions(agent.id);
        setVersions(vers);

        // Auto-load comparison if runs exist for v1.0 and v1.1
        const v1_0 = vers.find((v) => v.version === 'v1.0');
        const v1_1 = vers.find((v) => v.version === 'v1.1');

        if (v1_0 && v1_1) {
          const runV1_0 = fetchedRuns.find((r) => r.agentVersionId === v1_0.id && r.status === 'COMPLETED');
          const runV1_1 = fetchedRuns.find((r) => r.agentVersionId === v1_1.id && r.status === 'COMPLETED');

          if (runV1_0 && runV1_1) {
            try {
              const comp = await apiClient.getComparison(runV1_0.id, runV1_1.id);
              setComparisonReport(comp);
            } catch (err) {
              console.warn('Could not auto-load comparison:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  // Poll for completion of a test run
  const pollTestRun = async (runId: string): Promise<TestRun> => {
    let attempts = 0;
    while (attempts < 60) {
      const run = await apiClient.getTestRun(runId);
      if (run.status === 'COMPLETED' || run.status === 'FAILED') {
        return run;
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
      attempts++;
    }
    throw new Error('Test run timed out');
  };

  // Run full CI demonstration: v1.0 -> v1.1 -> Compare
  const handleRunFullDemo = async () => {
    if (versions.length < 2) return;
    const v1_0 = versions.find((v) => v.version === 'v1.0') || versions[0];
    const v1_1 = versions.find((v) => v.version === 'v1.1') || versions[1];

    setIsRunning(true);
    setRunningMessage(`Step 1/2: Enqueuing & running 15 scenarios against Baseline [${v1_0.version}]...`);

    try {
      // 1. Trigger v1.0
      const enqueued1 = await apiClient.triggerTestRun(v1_0.id);
      const completedRun1 = await pollTestRun(enqueued1.run_id);

      setRunningMessage(`Step 2/2: Enqueuing & running 15 scenarios against Candidate [${v1_1.version}]...`);

      // 2. Trigger v1.1
      const enqueued2 = await apiClient.triggerTestRun(v1_1.id);
      const completedRun2 = await pollTestRun(enqueued2.run_id);

      setRunningMessage('Analyzing behavioral differences & calculating regression severity...');

      // 3. Fetch Comparison
      const report = await apiClient.getComparison(completedRun1.id, completedRun2.id);
      setComparisonReport(report);
      setActiveTab('COMPARISON');

      // Refresh runs list
      const updatedRuns = await apiClient.getTestRuns();
      setTestRuns(updatedRuns);
    } catch (err: any) {
      alert(`Error running demo: ${err.message}`);
    } finally {
      setIsRunning(false);
      setRunningMessage('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300">
      <Header onOpenScenarios={() => setIsDrawerOpen(true)} scenarioCount={testCases.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Control Hero Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  Automated Regression Testing
                </span>
                <span className="text-xs text-slate-400 font-mono">CI / CD Guardrail</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                AI Agent Regression & Evaluation Engine
              </h1>
              <p className="text-sm text-slate-300/90 leading-relaxed">
                Evaluates agent versions across identical customer scenarios to detect policy, security, and tool-use regressions before production deployment.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                disabled={isRunning}
                onClick={handleRunFullDemo}
                className={`flex items-center justify-center space-x-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                  isRunning
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25 active:scale-95'
                }`}
              >
                {isRunning ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></span>
                    <span>Running Evaluation...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>Run Regression Pipeline</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Explore {testCases.length} Scenarios</span>
              </button>
            </div>
          </div>

          {/* Running progress notification */}
          {isRunning && (
            <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center space-x-3 text-xs text-emerald-300 animate-pulse">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-mono">{runningMessage}</span>
            </div>
          )}
        </div>

        {/* Metrics Overview Cards (When comparison exists) */}
        {comparisonReport && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="Baseline Pass Rate"
              value={`${comparisonReport.baseRun.passed}/${comparisonReport.baseRun.totalTests}`}
              subtext={`Agent ${comparisonReport.baseRun.version} (Compliant SOP)`}
              status="positive"
              icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
            />
            <MetricCard
              label="Candidate Pass Rate"
              value={`${comparisonReport.targetRun.passed}/${comparisonReport.targetRun.totalTests}`}
              delta={comparisonReport.summary.passRateDelta}
              deltaLabel="Pass Rate Drop"
              subtext={`Agent ${comparisonReport.targetRun.version} (Fast Returns SOP)`}
              status="critical"
              icon={<TrendingDown className="w-4 h-4 text-rose-400" />}
            />
            <MetricCard
              label="Policy Adherence Delta"
              value={`${(comparisonReport.summary.policyScoreDelta * 100).toFixed(0)}%`}
              delta={Math.round(comparisonReport.summary.policyScoreDelta * 100)}
              subtext={`${(comparisonReport.baseRun.avgPolicyScore * 100).toFixed(0)}% → ${(comparisonReport.targetRun.avgPolicyScore * 100).toFixed(0)}%`}
              status="critical"
              icon={<AlertOctagon className="w-4 h-4 text-rose-400" />}
            />
            <MetricCard
              label="Tool Accuracy Delta"
              value={`${(comparisonReport.summary.toolScoreDelta * 100).toFixed(0)}%`}
              subtext={`${(comparisonReport.baseRun.avgToolScore * 100).toFixed(0)}% → ${(comparisonReport.targetRun.avgToolScore * 100).toFixed(0)}%`}
              status="neutral"
              icon={<Scale className="w-4 h-4 text-purple-400" />}
            />
            <MetricCard
              label="Regressions Found"
              value={`🚨 ${comparisonReport.summary.totalRegressions}`}
              subtext={`${comparisonReport.differences.filter((d) => d.severity === 'CRITICAL').length} Critical Blockers`}
              status="critical"
              icon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('COMPARISON')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'COMPARISON'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Regression Comparison View</span>
            {comparisonReport && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold">
                {comparisonReport.summary.totalRegressions}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('VERSIONS')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'VERSIONS'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Agent Versions & Policies ({versions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('RUNS')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'RUNS'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Test Run History ({testRuns.length})</span>
          </button>
        </div>

        {/* Tab 1: Comparison View */}
        {activeTab === 'COMPARISON' && (
          <div>
            {comparisonReport ? (
              <RegressionDiff report={comparisonReport} />
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <Scale className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Comparison Generated Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click the button below to execute test scenarios across Agent v1.0 and Agent v1.1. The engine will detect policy regressions automatically.
                </p>
                <button
                  disabled={isRunning}
                  onClick={handleRunFullDemo}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Run Regression Pipeline Now</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Agent Versions View */}
        {activeTab === 'VERSIONS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-3 h-3 rounded-full ${ver.version === 'v1.0' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <h3 className="text-base font-bold text-white">{ver.version}</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {ver.version === 'v1.0' ? '(Compliant SOP)' : '(Regressed Policy)'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                    gpt-4o-mini
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    System Prompt
                  </span>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 max-h-32 overflow-y-auto">
                    {ver.systemPrompt}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Standard Operating Procedure (SOP)
                  </span>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {ver.sopPolicy}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    disabled={isRunning}
                    onClick={async () => {
                      setIsRunning(true);
                      setRunningMessage(`Running tests against ${ver.version}...`);
                      try {
                        const enq = await apiClient.triggerTestRun(ver.id);
                        await pollTestRun(enq.run_id);
                        const runs = await apiClient.getTestRuns();
                        setTestRuns(runs);
                        alert(`Test run for ${ver.version} finished!`);
                      } catch (e: any) {
                        alert(e.message);
                      } finally {
                        setIsRunning(false);
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span>Run Scenarios on {ver.version}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Test Runs History */}
        {activeTab === 'RUNS' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Execution Run History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Run ID</th>
                    <th className="pb-3 font-semibold">Agent Version</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Passed / Total</th>
                    <th className="pb-3 font-semibold">Policy Score</th>
                    <th className="pb-3 font-semibold">Tool Score</th>
                    <th className="pb-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {testRuns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 text-slate-300 font-mono">{r.id.slice(0, 12)}...</td>
                      <td className="py-3 text-white font-bold">{r.agentVersion?.version || 'N/A'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">
                        {r.passed} / {r.totalTests} ({r.totalTests > 0 ? ((r.passed / r.totalTests) * 100).toFixed(0) : 0}%)
                      </td>
                      <td className="py-3 text-emerald-400 font-semibold">{(r.avgPolicyScore * 100).toFixed(0)}%</td>
                      <td className="py-3 text-slate-300">{(r.avgToolScore * 100).toFixed(0)}%</td>
                      <td className="py-3 text-slate-500">{new Date(r.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Scenario Inspection Drawer */}
      <ScenarioDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        scenarios={testCases}
      />
    </div>
  );
};
