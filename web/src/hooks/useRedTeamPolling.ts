import { useQuery } from "@tanstack/react-query";
import type { RedTeamRun } from "@/types";

export function useRedTeamPolling(redTeamRunId: string | null) {
  return useQuery<RedTeamRun>({
    queryKey: ["red-team-run", redTeamRunId],
    queryFn: async () => {
      if (!redTeamRunId) throw new Error("No red team run ID");
      const res = await fetch(`/api/red-team-runs/${redTeamRunId}`);
      if (!res.ok) throw new Error("Failed to fetch red team run");
      return res.json();
    },
    enabled: !!redTeamRunId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.status === "completed" || data.status === "error") return false;
      return 2000;
    },
  });
}
