export type TestStatus = "PASS" | "FAIL";
export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type SeverityLevel = "NONE" | "LOW" | "MEDIUM" | "CRITICAL";
export type TestCaseCategory = "policy" | "identity" | "tool_usage" | "adversarial" | "edge_cases";
export type DiffType = "REGRESSION" | "IMPROVEMENT" | "NEW_FAILURE" | "UNCHANGED";

export interface Agent {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  versions?: AgentVersion[];
}

export interface AgentVersion {
  id: string;
  agentId: string;
  version: string; // e.g. "v1.0", "v1.1"
  systemPrompt: string;
  sopPolicy: string;
  config?: Record<string, any> | null;
  createdAt: string;
}

export interface ExpectedBehavior {
  requiredTools?: string[];
  forbiddenTools?: string[];
  requiredSteps?: string[];
  expectedOutcome?: string;
}

export interface CustomerContext {
  customerId?: string;
  customerName?: string;
  isVerified?: boolean;
  orderId?: string;
  subscriptionId?: string;
  orderStatus?: string;
  orderDate?: string;
  refundEligible?: boolean;
  daysSinceDelivery?: number;
  metadata?: Record<string, any>;
}

export interface TestCase {
  id: string;
  name: string;
  category: TestCaseCategory;
  input: string;
  contextData?: CustomerContext | null;
  expectedBehavior: ExpectedBehavior;
  createdAt: string;
}

export interface CapturedToolCall {
  tool: string;
  args: Record<string, any>;
  result: any;
  timestamp?: number;
}

export interface TestResult {
  id: string;
  testRunId: string;
  testCaseId: string;
  testCase?: TestCase;
  status: TestStatus;
  response: string;
  toolCalls: CapturedToolCall[];
  policyScore: number; // 0.0 - 1.0
  toolScore: number;   // 0.0 - 1.0
  qualityScore: number;// 0.0 - 1.0
  severity?: SeverityLevel | null;
  failureReason?: string | null;
  executionTimeMs?: number | null;
  createdAt: string;
}

export interface TestRun {
  id: string;
  agentVersionId: string;
  agentVersion?: AgentVersion;
  status: RunStatus;
  totalTests: number;
  passed: number;
  failed: number;
  avgPolicyScore: number;
  avgToolScore: number;
  avgQualityScore: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  results?: TestResult[];
}

export interface ComparisonItem {
  testCaseId: string;
  testCaseName: string;
  category: TestCaseCategory;
  input: string;
  type: DiffType;
  severity: SeverityLevel;
  baseStatus: TestStatus;
  targetStatus: TestStatus;
  baseToolCalls: CapturedToolCall[];
  targetToolCalls: CapturedToolCall[];
  baseResponse: string;
  targetResponse: string;
  reason: string;
  baseScores: {
    policy: number;
    tool: number;
    quality: number;
  };
  targetScores: {
    policy: number;
    tool: number;
    quality: number;
  };
}

export interface ComparisonReport {
  baseRun: {
    id: string;
    version: string;
    totalTests: number;
    passed: number;
    failed: number;
    avgPolicyScore: number;
    avgToolScore: number;
    avgQualityScore: number;
  };
  targetRun: {
    id: string;
    version: string;
    totalTests: number;
    passed: number;
    failed: number;
    avgPolicyScore: number;
    avgToolScore: number;
    avgQualityScore: number;
  };
  summary: {
    totalRegressions: number;
    totalImprovements: number;
    totalNewFailures: number;
    totalUnchanged: number;
    passRateDelta: number; // e.g. -13.3%
    policyScoreDelta: number;
    toolScoreDelta: number;
    qualityScoreDelta: number;
  };
  differences: ComparisonItem[];
}
