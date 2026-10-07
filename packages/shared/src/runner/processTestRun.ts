import { testRunRepository } from '../repositories/testRunRepository';
import { agentRepository } from '../repositories/agentRepository';
import { testCaseRepository } from '../repositories/testCaseRepository';
import { runAgent } from '../agent/runner';
import { evaluateTestCase } from '../evaluations/evaluator';

export interface TestJobPayload {
  testRunId: string;
  agentVersionId: string;
}

export async function processTestRun(data: TestJobPayload): Promise<void> {
  const { testRunId, agentVersionId } = data;
  console.log(`\n======================================================`);
  console.log(`🏁 Starting Test Run: ${testRunId} for Agent Version: ${agentVersionId}`);

  // 1. Mark Run as RUNNING
  await testRunRepository.update(testRunId, {
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
  });

  // 2. Fetch Agent Version & Test Cases
  const version = await agentRepository.getVersionById(agentVersionId);
  if (!version) {
    console.error(`❌ Agent version not found: ${agentVersionId}`);
    await testRunRepository.update(testRunId, { status: 'FAILED' });
    return;
  }

  const testCases = await testCaseRepository.getAll();
  console.log(`📋 Running ${testCases.length} scenarios against [${version.version}]...`);

  let passedCount = 0;
  let failedCount = 0;
  let totalPolicyScore = 0;
  let totalToolScore = 0;
  let totalQualityScore = 0;

  // 3. Execute each scenario sequentially
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`  [${i + 1}/${testCases.length}] Scenario: ${testCase.name} (${testCase.category})`);

    const agentOutput = await runAgent({
      systemPrompt: version.systemPrompt,
      sopPolicy: version.sopPolicy,
      config: version.config as any,
      testCase,
    });

    const evaluation = evaluateTestCase(
      testCase,
      agentOutput.toolCalls,
      agentOutput.response,
      version.sopPolicy
    );

    if (evaluation.status === 'PASS') {
      passedCount++;
      console.log(`    -> ✅ PASS | Tools: ${agentOutput.toolCalls.length} | Policy: ${evaluation.policyScore}`);
    } else {
      failedCount++;
      console.log(`    -> ❌ FAIL [${evaluation.severity}] Reason: ${evaluation.failureReason}`);
    }

    totalPolicyScore += evaluation.policyScore;
    totalToolScore += evaluation.toolScore;
    totalQualityScore += evaluation.qualityScore;

    await testRunRepository.saveResult({
      testRunId,
      testCaseId: testCase.id,
      status: evaluation.status,
      response: agentOutput.response,
      toolCalls: agentOutput.toolCalls,
      policyScore: evaluation.policyScore,
      toolScore: evaluation.toolScore,
      qualityScore: evaluation.qualityScore,
      severity: evaluation.severity,
      failureReason: evaluation.failureReason,
      executionTimeMs: agentOutput.executionTimeMs,
    });
  }

  const total = testCases.length;
  const avgPolicyScore = total > 0 ? Math.round((totalPolicyScore / total) * 100) / 100 : 0;
  const avgToolScore = total > 0 ? Math.round((totalToolScore / total) * 100) / 100 : 0;
  const avgQualityScore = total > 0 ? Math.round((totalQualityScore / total) * 100) / 100 : 0;

  // 4. Mark Run as COMPLETED
  await testRunRepository.update(testRunId, {
    status: 'COMPLETED',
    totalTests: total,
    passed: passedCount,
    failed: failedCount,
    avgPolicyScore,
    avgToolScore,
    avgQualityScore,
    completedAt: new Date().toISOString(),
  });

  console.log(`🎉 Test Run ${testRunId} Finished!`);
  console.log(`   Passed: ${passedCount}/${total} | Failed: ${failedCount}/${total}`);
  console.log(`   Policy: ${(avgPolicyScore * 100).toFixed(0)}% | Tool: ${(avgToolScore * 100).toFixed(0)}% | Quality: ${(avgQualityScore * 100).toFixed(0)}%`);
  console.log(`======================================================\n`);
}
