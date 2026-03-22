import { RunStatusBadge } from "@/components/runs/RunStatusBadge";

interface AgentRunCardProps {
  agentRun: {
    id: string;
    triggerEvent: string;
    previousScore: number | null;
    newScore: number | null;
    regressionFound: boolean;
    decision: string | null;
    status: string;
    createdAt: string;
    deployment: { name: string };
  };
}

function toRunStatus(status: string): "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" {
  const normalized = status.toUpperCase();
  if (normalized === "RUNNING") return "RUNNING";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "FAILED" || normalized === "ERROR") return "FAILED";
  return "PENDING";
}

export function AgentRunCard({ agentRun }: AgentRunCardProps) {
  const previous = agentRun.previousScore;
  const next = agentRun.newScore;

  return (
    <div className="border border-[#1F1F23] rounded-lg bg-[#111113] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#FAFAFA]">{agentRun.deployment.name}</p>
        <RunStatusBadge status={toRunStatus(agentRun.status)} />
      </div>

      <p className="text-xs text-[#71717A] mt-1">{agentRun.triggerEvent}</p>

      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-sm text-[#A1A1AA]">{previous === null ? "--" : previous.toFixed(2)}</span>
        <span className="text-[#52525B]">-&gt;</span>
        <span className="font-mono text-sm text-[#FAFAFA]">{next === null ? "--" : next.toFixed(2)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {agentRun.regressionFound ? (
          <span className="px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] text-xs font-medium">
            Regression
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] text-xs font-medium">
            Stable
          </span>
        )}
        {agentRun.decision && (
          <span className="text-xs text-[#A1A1AA]">Decision: {agentRun.decision}</span>
        )}
      </div>

      <p className="text-xs text-[#71717A] mt-3">{new Date(agentRun.createdAt).toLocaleString()}</p>
    </div>
  );
}
