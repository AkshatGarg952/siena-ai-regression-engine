import { testRunRepository } from '../repositories/testRunRepository';
import { ComparisonReport, ComparisonItem, DiffType, SeverityLevel } from '@siena/shared';

export const comparisonService = {
  async compareRuns(baseRunId: string, targetRunId: string): Promise<ComparisonReport> {
    const baseRun = await testRunRepository.getById(baseRunId);
    const targetRun = await testRunRepository.getById(targetRunId);

    if (!baseRun) {
      throw new Error(`Base test run not found: ${baseRunId}`);
    }
    if (!targetRun) {
      throw new Error(`Target test run not found: ${targetRunId}`);
    }

    const baseResults = await testRunRepository.getResultsByRunId(baseRunId);
    const targetResults = await testRunRepository.getResultsByRunId(targetRunId);

    const baseMap = new Map(baseResults.map((r) => [r.testCaseId, r]));
    const targetMap = new Map(targetResults.map((r) => [r.testCaseId, r]));

    const differences: ComparisonItem[] = [];

    // Collect all unique testCaseIds
    const allTestCaseIds = Array.from(new Set([...baseMap.keys(), ...targetMap.keys()]));

    let totalRegressions = 0;
    let totalImprovements = 0;
    let totalNewFailures = 0;
    let totalUnchanged = 0;

    for (const testCaseId of allTestCaseIds) {
      const base = baseMap.get(testCaseId);
      const target = targetMap.get(testCaseId);

      if (!base || !target) continue;

      let type: DiffType = 'UNCHANGED';
      let severity: SeverityLevel = 'NONE';
      let reason = '';

      if (base.status === 'PASS' && target.status === 'FAIL') {
        type = 'REGRESSION';
        totalRegressions++;
        severity = target.severity || 'CRITICAL';
        reason = target.failureReason || 'Behavior regressed from passing to failing.';
      } else if (base.status === 'FAIL' && target.status === 'PASS') {
        type = 'IMPROVEMENT';
        totalImprovements++;
        severity = 'NONE';
        reason = 'Behavior fixed: scenario is now passing.';
      } else if (base.status === 'FAIL' && target.status === 'FAIL') {
        type = 'NEW_FAILURE';
        totalNewFailures++;
        severity = target.severity || 'MEDIUM';
        reason = target.failureReason || 'Failed in both versions.';
      } else {
        type = 'UNCHANGED';
        totalUnchanged++;
        severity = 'NONE';
        reason = 'Identical passing behavior.';
      }

      const testCaseInfo = target.testCase || base.testCase;

      differences.push({
        testCaseId,
        testCaseName: testCaseInfo?.name || 'Unknown Scenario',
        category: (testCaseInfo?.category as any) || 'policy',
        input: testCaseInfo?.input || '',
        type,
        severity,
        baseStatus: base.status,
        targetStatus: target.status,
        baseToolCalls: base.toolCalls,
        targetToolCalls: target.toolCalls,
        baseResponse: base.response,
        targetResponse: target.response,
        reason,
        baseScores: {
          policy: base.policyScore,
          tool: base.toolScore,
          quality: base.qualityScore,
        },
        targetScores: {
          policy: target.policyScore,
          tool: target.toolScore,
          quality: target.qualityScore,
        },
      });
    }

    // Sort: Regressions first, then New Failures, Improvements, Unchanged
    const sortPriority: Record<DiffType, number> = {
      REGRESSION: 0,
      NEW_FAILURE: 1,
      IMPROVEMENT: 2,
      UNCHANGED: 3,
    };
    differences.sort((a, b) => sortPriority[a.type] - sortPriority[b.type]);

    const basePassRate = baseRun.totalTests > 0 ? (baseRun.passed / baseRun.totalTests) * 100 : 0;
    const targetPassRate = targetRun.totalTests > 0 ? (targetRun.passed / targetRun.totalTests) * 100 : 0;

    return {
      baseRun: {
        id: baseRun.id,
        version: baseRun.agentVersion?.version || 'v1.0',
        totalTests: baseRun.totalTests,
        passed: baseRun.passed,
        failed: baseRun.failed,
        avgPolicyScore: Math.round(baseRun.avgPolicyScore * 100) / 100,
        avgToolScore: Math.round(baseRun.avgToolScore * 100) / 100,
        avgQualityScore: Math.round(baseRun.avgQualityScore * 100) / 100,
      },
      targetRun: {
        id: targetRun.id,
        version: targetRun.agentVersion?.version || 'v1.1',
        totalTests: targetRun.totalTests,
        passed: targetRun.passed,
        failed: targetRun.failed,
        avgPolicyScore: Math.round(targetRun.avgPolicyScore * 100) / 100,
        avgToolScore: Math.round(targetRun.avgToolScore * 100) / 100,
        avgQualityScore: Math.round(targetRun.avgQualityScore * 100) / 100,
      },
      summary: {
        totalRegressions,
        totalImprovements,
        totalNewFailures,
        totalUnchanged,
        passRateDelta: Math.round((targetPassRate - basePassRate) * 10) / 10,
        policyScoreDelta: Math.round((targetRun.avgPolicyScore - baseRun.avgPolicyScore) * 100) / 100,
        toolScoreDelta: Math.round((targetRun.avgToolScore - baseRun.avgToolScore) * 100) / 100,
        qualityScoreDelta: Math.round((targetRun.avgQualityScore - baseRun.avgQualityScore) * 100) / 100,
      },
      differences,
    };
  },
};
