import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface MetricScore {
  name: string;
  score: number;
  reason: string;
}

export interface TestCaseResult {
  id: string;
  input: string;
  output: string;
  overallScore: number;
  status: "CRITICAL FAIL" | "FAIL" | "WARN" | "PASS" | "OPTIMAL";
  latencyMs: number;
  metrics: MetricScore[];
}

export interface RunDetail {
  id: string;
  suiteName: string;
  domain: string;
  modelId: string;
  overallScore: number;
  testCaseCount: number;
  passedCount: number;
  failedCount: number;
  avgLatencyMs: number;
  testCases: TestCaseResult[];
}

export function useRun(runId: string) {
  return useQuery({
    queryKey: ["run", runId],
    queryFn: () => api.get(`/api/runs/${runId}`),
    enabled: !!runId,
  });
}
