import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface RunFilters {
  suiteId?: string;
  modelId?: string;
  status?: string;
  limit?: number;
}

export function useRuns(filters?: RunFilters) {
  const params = new URLSearchParams();
  if (filters?.suiteId) params.set("suiteId", filters.suiteId);
  if (filters?.modelId) params.set("modelId", filters.modelId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.limit) params.set("limit", String(filters.limit));

  const query = params.toString();

  return useQuery({
    queryKey: ["runs", filters],
    queryFn: () => api.get(`/api/runs${query ? `?${query}` : ""}`),
  });
}
