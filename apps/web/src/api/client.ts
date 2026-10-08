import { Agent, AgentVersion, TestCase, TestRun, TestResult, ComparisonReport } from '../types';

const rawBase = ((import.meta as any).env?.VITE_API_URL || '').trim().replace(/\/$/, '');
const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';

export const apiClient = {
  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getAgents(): Promise<Agent[]> {
    const res = await fetch(`${API_BASE}/agents`);
    const json = await res.json().catch(() => ({}));
    return json.data || [];
  },

  async getAgentVersions(agentId: string): Promise<AgentVersion[]> {
    const res = await fetch(`${API_BASE}/agents/${agentId}/versions`);
    const json = await res.json().catch(() => ({}));
    return json.data || [];
  },

  async getTestCases(): Promise<TestCase[]> {
    const res = await fetch(`${API_BASE}/test-cases`);
    const json = await res.json().catch(() => ({}));
    return json.data || [];
  },

  async getTestRuns(): Promise<TestRun[]> {
    const res = await fetch(`${API_BASE}/test-runs`);
    const json = await res.json().catch(() => ({}));
    return json.data || [];
  },

  async getTestRun(runId: string): Promise<TestRun> {
    const res = await fetch(`${API_BASE}/test-runs/${runId}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || `Failed to fetch test run (HTTP ${res.status})`);
    }
    return json.data;
  },

  async getTestResults(runId: string): Promise<TestResult[]> {
    const res = await fetch(`${API_BASE}/test-runs/${runId}/results`);
    const json = await res.json().catch(() => ({}));
    return json.data || [];
  },

  async triggerTestRun(agentVersionId: string): Promise<{ run_id: string; status: string; totalTests: number }> {
    const res = await fetch(`${API_BASE}/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentVersionId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || `Failed to trigger test run (HTTP ${res.status})`);
    }
    return json.data;
  },

  async getComparison(baseRunId: string, targetRunId: string): Promise<ComparisonReport> {
    const res = await fetch(`${API_BASE}/comparisons?baseRunId=${baseRunId}&targetRunId=${targetRunId}`);
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to fetch comparison report');
    }
    return json.data;
  },
};
