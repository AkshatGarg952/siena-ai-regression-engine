import { prisma } from '../config/db';
import { TestRun, TestResult, RunStatus } from '../types';

const memoryRuns: Map<string, TestRun> = new Map();
const memoryResults: Map<string, TestResult> = new Map();

let isDbConnected: boolean | null = null;
async function checkDb(): Promise<boolean> {
  if (isDbConnected !== null) return isDbConnected;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    return true;
  } catch {
    isDbConnected = false;
    return false;
  }
}

export const testRunRepository = {
  async getAll(): Promise<TestRun[]> {
    if (await checkDb()) {
      try {
        const rows = await prisma.testRun.findMany({
          include: { agentVersion: true, results: { include: { testCase: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((r: any) => ({
          id: r.id,
          agentVersionId: r.agentVersionId,
          agentVersion: r.agentVersion ? {
            id: r.agentVersion.id,
            agentId: r.agentVersion.agentId,
            version: r.agentVersion.version,
            systemPrompt: r.agentVersion.systemPrompt,
            sopPolicy: r.agentVersion.sopPolicy,
            config: r.agentVersion.config as any,
            createdAt: r.agentVersion.createdAt.toISOString(),
          } : undefined,
          status: r.status as RunStatus,
          totalTests: r.totalTests,
          passed: r.passed,
          failed: r.failed,
          avgPolicyScore: r.avgPolicyScore,
          avgToolScore: r.avgToolScore,
          avgQualityScore: r.avgQualityScore,
          startedAt: r.startedAt?.toISOString() || null,
          completedAt: r.completedAt?.toISOString() || null,
          createdAt: r.createdAt.toISOString(),
          results: r.results.map((res: any) => ({
            id: res.id,
            testRunId: res.testRunId,
            testCaseId: res.testCaseId,
            testCase: res.testCase ? {
              id: res.testCase.id,
              name: res.testCase.name,
              category: res.testCase.category as any,
              input: res.testCase.input,
              contextData: res.testCase.contextData as any,
              expectedBehavior: res.testCase.expectedBehavior as any,
              createdAt: res.testCase.createdAt.toISOString(),
            } : undefined,
            status: res.status as any,
            response: res.response,
            toolCalls: res.toolCalls as any,
            policyScore: res.policyScore,
            toolScore: res.toolScore,
            qualityScore: res.qualityScore,
            severity: res.severity as any,
            failureReason: res.failureReason,
            executionTimeMs: res.executionTimeMs,
            createdAt: res.createdAt.toISOString(),
          })),
        }));
      } catch (e) {
        console.warn('DB query failed, using memory cache:', e);
      }
    }
    return Array.from(memoryRuns.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getById(id: string): Promise<TestRun | null> {
    if (await checkDb()) {
      try {
        const r = await prisma.testRun.findUnique({
          where: { id },
          include: { agentVersion: true, results: { include: { testCase: true } } },
        });
        if (!r) return null;
        return {
          id: r.id,
          agentVersionId: r.agentVersionId,
          agentVersion: r.agentVersion ? {
            id: r.agentVersion.id,
            agentId: r.agentVersion.agentId,
            version: r.agentVersion.version,
            systemPrompt: r.agentVersion.systemPrompt,
            sopPolicy: r.agentVersion.sopPolicy,
            config: r.agentVersion.config as any,
            createdAt: r.agentVersion.createdAt.toISOString(),
          } : undefined,
          status: r.status as RunStatus,
          totalTests: r.totalTests,
          passed: r.passed,
          failed: r.failed,
          avgPolicyScore: r.avgPolicyScore,
          avgToolScore: r.avgToolScore,
          avgQualityScore: r.avgQualityScore,
          startedAt: r.startedAt?.toISOString() || null,
          completedAt: r.completedAt?.toISOString() || null,
          createdAt: r.createdAt.toISOString(),
          results: r.results.map((res: any) => ({
            id: res.id,
            testRunId: res.testRunId,
            testCaseId: res.testCaseId,
            testCase: res.testCase ? {
              id: res.testCase.id,
              name: res.testCase.name,
              category: res.testCase.category as any,
              input: res.testCase.input,
              contextData: res.testCase.contextData as any,
              expectedBehavior: res.testCase.expectedBehavior as any,
              createdAt: res.testCase.createdAt.toISOString(),
            } : undefined,
            status: res.status as any,
            response: res.response,
            toolCalls: res.toolCalls as any,
            policyScore: res.policyScore,
            toolScore: res.toolScore,
            qualityScore: res.qualityScore,
            severity: res.severity as any,
            failureReason: res.failureReason,
            executionTimeMs: res.executionTimeMs,
            createdAt: res.createdAt.toISOString(),
          })),
        };
      } catch (e) {
        console.warn('DB query failed, using memory cache:', e);
      }
    }
    const run = memoryRuns.get(id);
    if (!run) return null;
    const results = Array.from(memoryResults.values()).filter((r) => r.testRunId === id);
    return { ...run, results };
  },

  async create(data: { agentVersionId: string; totalTests: number }): Promise<TestRun> {
    const id = crypto.randomUUID ? crypto.randomUUID() : `run_${Date.now()}`;
    const now = new Date().toISOString();
    const run: TestRun = {
      id,
      agentVersionId: data.agentVersionId,
      status: 'PENDING',
      totalTests: data.totalTests,
      passed: 0,
      failed: 0,
      avgPolicyScore: 0,
      avgToolScore: 0,
      avgQualityScore: 0,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      results: [],
    };

    if (await checkDb()) {
      try {
        await prisma.testRun.create({
          data: {
            id,
            agentVersionId: data.agentVersionId,
            status: 'PENDING',
            totalTests: data.totalTests,
          },
        });
        return run;
      } catch (e) {
        console.warn('DB create run failed, saving in memory:', e);
      }
    }

    memoryRuns.set(id, run);
    return run;
  },

  async update(id: string, data: Partial<TestRun>): Promise<TestRun | null> {
    if (await checkDb()) {
      try {
        await prisma.testRun.update({
          where: { id },
          data: {
            status: data.status,
            passed: data.passed,
            failed: data.failed,
            avgPolicyScore: data.avgPolicyScore,
            avgToolScore: data.avgToolScore,
            avgQualityScore: data.avgQualityScore,
            startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
            completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
          },
        });
      } catch (e) {
        console.warn('DB update run failed, using memory:', e);
      }
    }

    const existing = memoryRuns.get(id);
    if (existing) {
      const updated = { ...existing, ...data };
      memoryRuns.set(id, updated);
      return updated;
    }
    return null;
  },

  async saveResult(data: Omit<TestResult, 'id' | 'createdAt'>): Promise<TestResult> {
    const id = crypto.randomUUID ? crypto.randomUUID() : `res_${Date.now()}`;
    const now = new Date().toISOString();
    const result: TestResult = {
      ...data,
      id,
      createdAt: now,
    };

    if (await checkDb()) {
      try {
        await prisma.testResult.create({
          data: {
            id,
            testRunId: data.testRunId,
            testCaseId: data.testCaseId,
            status: data.status,
            response: data.response,
            toolCalls: data.toolCalls as any,
            policyScore: data.policyScore,
            toolScore: data.toolScore,
            qualityScore: data.qualityScore,
            severity: data.severity || null,
            failureReason: data.failureReason || null,
            executionTimeMs: data.executionTimeMs || null,
          },
        });
        return result;
      } catch (e) {
        console.warn('DB save result failed, using memory:', e);
      }
    }

    memoryResults.set(id, result);
    return result;
  },

  async getResultsByRunId(runId: string): Promise<TestResult[]> {
    if (await checkDb()) {
      try {
        const rows = await prisma.testResult.findMany({
          where: { testRunId: runId },
          include: { testCase: true },
        });
        return rows.map((res: any) => ({
          id: res.id,
          testRunId: res.testRunId,
          testCaseId: res.testCaseId,
          testCase: res.testCase ? {
            id: res.testCase.id,
            name: res.testCase.name,
            category: res.testCase.category as any,
            input: res.testCase.input,
            contextData: res.testCase.contextData as any,
            expectedBehavior: res.testCase.expectedBehavior as any,
            createdAt: res.testCase.createdAt.toISOString(),
          } : undefined,
          status: res.status as any,
          response: res.response,
          toolCalls: res.toolCalls as any,
          policyScore: res.policyScore,
          toolScore: res.toolScore,
          qualityScore: res.qualityScore,
          severity: res.severity as any,
          failureReason: res.failureReason,
          executionTimeMs: res.executionTimeMs,
          createdAt: res.createdAt.toISOString(),
        }));
      } catch (e) {
        console.warn('DB query results failed, using memory:', e);
      }
    }
    return Array.from(memoryResults.values()).filter((r) => r.testRunId === runId);
  },
};
