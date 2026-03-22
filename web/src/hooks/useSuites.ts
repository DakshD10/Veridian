import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Suite {
  id: string;
  name: string;
  domain: string | null;
  createdAt: string;
  _count?: {
    testCases: number;
    runs: number;
  };
}

export function useSuites() {
  return useQuery<Suite[]>({
    queryKey: ["suites"],
    queryFn: () => api.get("/api/suites"),
  });
}

export function useSuite(id: string) {
  return useQuery({
    queryKey: ["suite", id],
    queryFn: () => api.get(`/api/suites/${id}`),
    enabled: !!id,
  });
}
