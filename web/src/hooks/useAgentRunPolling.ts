import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useAgentRunPolling(agentRunId: string | null) {
  return useQuery({
    queryKey: ["agent-run", agentRunId],
    queryFn: () => api.get(`/api/agent-runs/${agentRunId}`),
    enabled: !!agentRunId,
    refetchInterval: (query) => {
      const data = query.state.data as { status?: string } | undefined;
      if (data?.status === "completed" || data?.status === "error") {
        return false;
      }
      return 2000;
    },
  });
}
