import { useQuery } from "@tanstack/react-query";
import type { RedTeamRun } from "@/types";

interface RedTeamRunFilters {
  suiteId?: string;
  modelId?: string;
  status?: "running" | "completed" | "error";
  limit?: number;
}

export function useRedTeamRuns(filters?: RedTeamRunFilters) {
  const params = new URLSearchParams();
  if (filters?.suiteId) params.set("suiteId", filters.suiteId);
  if (filters?.modelId) params.set("modelId", filters.modelId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.limit) params.set("limit", String(filters.limit));

  const query = params.toString();

  return useQuery<RedTeamRun[]>({
    queryKey: ["red-team-runs", filters],
    queryFn: async () => {
      const res = await fetch(`/api/red-team-runs${query ? `?${query}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch red team runs");
      return res.json();
    },
  });
}
