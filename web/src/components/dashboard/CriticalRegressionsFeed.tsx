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
    .slice(0, 5); // show max 5

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
    <div className="space-y-3">
      {regressions.map((run) => {
        const prev  = run.previousScore ?? 0;
        const next  = run.newScore ?? 0;
        const delta = calcDelta(prev, next);

        return (
          <Link
            key={run.id}
            href={`/agent?runId=${run.id}`}
            className="block"
          >
            <div className="flex items-center justify-between 
                            rounded-lg border border-[#EF4444]/20 
                            bg-[#EF4444]/5 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-sm text-[#FAFAFA] font-medium">
                  {run.deployment.name}
                </span>
                <span className="font-mono text-xs text-[#71717A]">
                  {formatTimeAgo(run.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[#EF4444]">
                  {prev.toFixed(2)} → {next.toFixed(2)}
                </span>
                <span className="bg-[#EF4444]/10 text-[#EF4444] 
                                 text-xs px-2 py-0.5 rounded font-mono">
                  {delta}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
