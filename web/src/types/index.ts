export interface EvalSuite {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    testCases: number;
    runs: number;
  };
}

export interface TestCase {
  id: string;
  suiteId: string;
  input: string;
  expectedOutput: string;
  context?: string;
  tags: string[];
  createdAt: string;
}

export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface EvalRun {
  id: string;
  suiteId: string;
  modelId: string;
  modelVersion?: string;
  status: RunStatus;
  triggeredBy: string;
  overallScore?: number;
  passedCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string;
  results?: TestResult[];
}

export interface MetricScore {
  id: string;
  testResultId: string;
  metricName: string;
  score: number;
  passed: boolean;
  reason?: string;
  createdAt: string;
}

export interface TestResult {
  id: string;
  runId: string;
  testCaseId: string;
  modelOutput: string;
  scores: Record<string, number>;
  reasons?: Record<string, string>;
  overallScore: number;
  passed: boolean;
  latencyMs?: number;
  createdAt: string;
  testCase?: TestCase;
  metricScores?: MetricScore[];
}

export interface WatchedDeployment {
  id: string;
  name: string;
  description?: string;
  suiteId: string;
  currentModel: string;
  threshold: number;
  slackWebhookUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  suite?: EvalSuite;
  agentRuns?: AgentRun[];
}

export interface AgentTraceStep {
  node: string;
  timestamp: string;
  summary: string;
  status: "done" | "error" | "running";
}

export interface AgentRun {
  id: string;
  deploymentId: string;
  evalRunId?: string;
  triggerEvent: string;
  previousScore?: number;
  newScore?: number;
  regressionFound: boolean;
  decision?: string;
  reportSummary?: string;
  agentTrace?: AgentTraceStep[];
  slackNotified: boolean;
  status: string;
  createdAt: string;
  deployment?: WatchedDeployment;
}

export interface DashboardStats {
  totalSuites: number;
  totalRuns: number;
  regressionsCaught: number;
  avgScore: number;
}

export interface GroqModel {
  id: string;
  label: string;
  speed: string;
  provider: "groq" | "gemini";
}

export interface QualityTrendPoint {
  date: string;
  score: number;
  modelId: string;
}

export interface ModelComparisonPoint {
  modelId: string;
  avgScore: number;
  runCount: number;
}

export const AGENT_NODE_ORDER = [
  "trigger_received",
  "load_eval_suite",
  "run_model",
  "score_results",
  "compare_baseline",
  "generate_report",
  "notify",
] as const;

export type AgentNodeName = typeof AGENT_NODE_ORDER[number];
