import { TestCase, CapturedToolCall, TestStatus, SeverityLevel } from '../types';
import { evaluateDeterministic } from './deterministic';
import { evaluateJudge } from './judge';

export interface FinalEvaluation {
  status: TestStatus;
  policyScore: number;
  toolScore: number;
  qualityScore: number;
  severity: SeverityLevel;
  failureReason: string | null;
}

export function evaluateTestCase(
  testCase: TestCase,
  toolCalls: CapturedToolCall[],
  agentResponse: string,
  sopPolicy: string
): FinalEvaluation {
  const detResult = evaluateDeterministic(testCase, toolCalls, agentResponse);
  const judgeResult = evaluateJudge(testCase, toolCalls, agentResponse, sopPolicy);

  const status: TestStatus = detResult.passed ? 'PASS' : 'FAIL';
  const combinedPolicyScore = Math.round(((detResult.policyScore * 0.7 + judgeResult.policyAdherenceScore * 0.3)) * 100) / 100;
  const toolScore = detResult.toolScore;
  const qualityScore = judgeResult.qualityScore;

  let failureReason: string | null = null;
  if (status === 'FAIL') {
    const reasons = [...detResult.reasons];
    if (judgeResult.reasoningNotes && judgeResult.policyAdherenceScore < 0.5) {
      reasons.push(judgeResult.reasoningNotes);
    }
    failureReason = reasons.join(' | ');
  }

  return {
    status,
    policyScore: combinedPolicyScore,
    toolScore,
    qualityScore,
    severity: detResult.severity,
    failureReason,
  };
}
