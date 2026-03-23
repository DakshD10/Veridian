"use client";

interface PipelineStep {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
}

interface AgentPipelineHeaderProps {
  agentTrace?: Array<{
    node: string;
    status: "done" | "pending" | "running" | "error";
  }>;
}

const PIPELINE_STEPS = [
  { key: "trigger", label: "trigger" },
  { key: "load", label: "load" },
  { key: "run", label: "run" },
  { key: "score", label: "score" },
  { key: "compare", label: "compare" },
  { key: "report", label: "report" },
  { key: "notify", label: "notify" },
];

export function AgentPipelineHeader({ agentTrace = [] }: AgentPipelineHeaderProps) {
  const traceMap = new Map(agentTrace.map((step) => [step.node, step]));

  const steps: PipelineStep[] = PIPELINE_STEPS.map((step) => {
    const traceData = traceMap.get(step.key);
    return {
      key: step.key,
      label: step.label,
      status: (traceData?.status as PipelineStep["status"]) || "pending",
    };
  });

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <div key={step.key} className="flex items-center gap-1">
            {/* Pill */}
            <div
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono relative ${
                step.status === "pending"
                  ? "bg-[#1A1A1E] border border-[#27272A] text-[#3F3F46]"
                  : step.status === "running"
                    ? "bg-violet-950/60 border border-violet-700 text-violet-300"
                    : step.status === "error"
                      ? "bg-red-950/60 border border-red-800 text-red-400"
                      : "bg-green-950/60 border border-green-800 text-green-500"
              }`}
            >
              {/* Running pill with pulsing dot */}
              {step.status === "running" && (
                <>
                  <div className="w-1 h-1 bg-violet-300 rounded-full animate-pulse mr-1" />
                  <span>{step.label}</span>
                </>
              )}
              {/* Other pills without dot */}
              {step.status !== "running" && <span>{step.label}</span>}
            </div>

            {/* Connector arrow */}
            {!isLast && (
              <span className="text-[#27272A] text-[10px]">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
