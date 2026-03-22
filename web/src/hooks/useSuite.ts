import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface TestCase {
  id: string;
  suiteId: string;
  input: string;
  expectedOutput: string;
  context?: string;
  tags: string[];
}

export interface SuiteDetail {
  id: string;
  name: string;
  domain: string;
  testCaseCount: number;
  runCount: number;
  lastRunScore: number;
  testCases: TestCase[];
}

export function useSuite(suiteId: string) {
  return useQuery({
    queryKey: ["suite", suiteId],
    queryFn: () => api.get(`/api/suites/${suiteId}`),
    enabled: !!suiteId,
  });
}
