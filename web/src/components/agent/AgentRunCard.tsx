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

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }) + ', ' + date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: 'UTC'
  }) + ' UTC';
}

export function AgentRunCard({ agentRun }: AgentRunCardProps) {
  const previous = agentRun.previousScore;
  const next = agentRun.newScore;
  const isRegression = agentRun.regressionFound && previous !== null && next !== null && next < previous;

  return (
    <div className="bg-[#0E0E11] border border-[#1E1E22] rounded-xl p-5 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-sans text-[18px] font-bold text-[#FAFAFA]">{agentRun.deployment.name}</h2>
            <RunStatusBadge status={toRunStatus(agentRun.status)} />
          </div>
          
          <p className="text-sm text-[#71717A] mb-3">{agentRun.triggerEvent}</p>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold text-[20px] ${previous !== null ? "text-[#A1A1AA]" : "text-[#52525B]"}`}>
                {previous !== null ? previous.toFixed(2) : "--"}
              </span>
              <span className="text-[#71717A]">→</span>
              <span className={`font-mono font-bold text-[20px] ${next !== null ? (isRegression ? "text-red-400" : "text-green-400") : "text-[#52525B]"}`}>
                {next !== null ? next.toFixed(2) : "--"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {agentRun.regressionFound && (
              <span className="bg-red-950/60 text-red-400 border border-red-900 font-mono text-[11px] px-2 py-0.5 rounded">
                Regression
              </span>
            )}
            {agentRun.decision && (
              <span className="font-mono text-[12px] text-[#71717A]">
                Decision: {agentRun.decision}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-[11px] text-[#3F3F46]">
            {formatTimestamp(agentRun.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
