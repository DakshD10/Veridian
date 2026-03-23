// src/components/dashboard/CriticalRegressionsFeed.tsx
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface AgentRun {
  id: string;
  previousScore: number | null;
  newScore: number | null;
  regressionFound: boolean;
  createdAt: string;
  deployment: {
    id: string;
    name: string;
  };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

function calcDelta(prev: number, next: number): string {
  const pct = ((next - prev) / prev) * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

export function CriticalRegressionsFeed() {
  const { data, isLoading, isError } = useQuery<AgentRun[]>({
    queryKey: ["agent-runs-regressions"],
    queryFn: () => api.get("/api/agent-runs"),
  });

  const regressions = (data ?? [])
    .filter((r) => r.regressionFound)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Show all, sorted by date

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-[#71717A]">
        Failed to load regressions.
      </p>
    );
  }

  if (regressions.length === 0) {
    return (
      <p className="text-sm text-[#71717A]">
        No regressions detected yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {regressions.map((run) => {
        const prev  = run.previousScore ?? 0;
        const next  = run.newScore ?? 0;
        const delta = calcDelta(prev, next);

        return (
          <Link
            key={run.id}
            href={`/agent?agentRunId=${run.id}`}
            className="block"
          >
            <div className="px-4 py-3 border-b border-[#1A1A1E] hover:bg-[#111115] transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-[#FAFAFA]">
                    {run.deployment.name}
                  </span>
                  <span className="text-[11px] text-[#52525B] font-mono">
                    {formatTimeAgo(run.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[12px] text-[#A1A1AA]">
                      {prev.toFixed(2)}
                    </span>
                    <span className="font-mono text-[12px] text-red-400 font-bold">
                      →
                    </span>
                    <span className="font-mono text-[12px] text-red-400 font-bold">
                      {next.toFixed(2)}
                    </span>
                  </div>
                  <span className="bg-red-950/40 text-red-400 border border-red-900/50 font-mono text-[10px] px-1.5 py-0.5 rounded">
                    {delta}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
