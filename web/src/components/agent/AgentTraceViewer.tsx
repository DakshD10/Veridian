import { AGENT_NODE_ORDER, AgentNodeName } from "@/types";
import { TraceNode } from "./TraceNode";

interface AgentTraceStep {
  node: string;
  timestamp: string;
  summary: string;
  status: "done" | "pending" | "running" | "error";
  reportSummary?: string | null;
}

export function AgentTraceViewer({
  agentTrace = [],
}: {
  agentTrace?: AgentTraceStep[];
}) {
  const traceMap = new Map(
    agentTrace
      .filter((step) =>
        AGENT_NODE_ORDER.includes(step.node as AgentNodeName)
      )
      .map((step) => [step.node as AgentNodeName, step])
  );

  return (
    <div className="flex flex-col w-full">
      {AGENT_NODE_ORDER.map((nodeName, index) => {
        const traceData = traceMap.get(nodeName);
        const state: "DONE" | "PENDING" =
          traceData?.status === "done" ? "DONE" : "PENDING";

        const showConnector = index < AGENT_NODE_ORDER.length - 1;
        const nextNode = AGENT_NODE_ORDER[index + 1];
        const nextTraceData = nextNode ? traceMap.get(nextNode) : undefined;
        const connectorDone =
          traceData?.status === "done" && nextTraceData?.status === "done";

        return (
          <div key={nodeName} className="flex flex-col w-full">
            <TraceNode
              nodeKey={nodeName}
              name={nodeName}
              summary={traceData?.summary ?? "Pending"}
              timing={traceData?.timestamp ?? "--:--"}
              state={state === "DONE" ? "DONE" : "PENDING"}
              reportText={traceData?.reportSummary ?? undefined}
            />
            {showConnector && (
              <div className="w-[2px] h-6 mx-auto overflow-hidden relative">
                <div
                  className={`w-full h-full ${connectorDone ? "bg-[#22C55E]" : "bg-[#27272A]"}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
