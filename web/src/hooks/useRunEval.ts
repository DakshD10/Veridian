import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useRunEval(runId: string | null) {
  return useQuery({
    queryKey: ["run-eval", runId],
    queryFn: () => api.get(`/api/runs/${runId}`),
    enabled: !!runId,
    refetchInterval: (query) => {
      const data = query.state.data as { status?: string } | undefined;
      if (data?.status === "COMPLETED" || data?.status === "FAILED") {
        return false;
      }
      return 3000;
    },
  });
}
