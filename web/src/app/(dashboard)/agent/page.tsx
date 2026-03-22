"use client";

import { useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentTraceViewer } from "@/components/agent/AgentTraceViewer";
import { AgentRunCard } from "@/components/agent/AgentRunCard";
import { RegressionAlert } from "@/components/agent/RegressionAlert";
import { RegressionBanner } from "@/components/agent/RegressionBanner";
import { useAgentRunPolling } from "@/hooks/useAgentRunPolling";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentRunListItem {
  id: string;
  status: string;
  triggerEvent: string;
  createdAt: string;
  regressionFound: boolean;
  previousScore: number | null;
  newScore: number | null;
  decision: string | null;
  deployment: {
    name: string;
  };
}

function AgentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedRunId = searchParams.get("agentRunId");

  const {
    data: agentRuns = [],
    isLoading: listLoading,
    isError: listError,
  } = useQuery<AgentRunListItem[]>({
    queryKey: ["agent-runs"],
    queryFn: async () => {
      const res = await fetch("/api/agent-runs");
      if (!res.ok) throw new Error("Failed to fetch agent runs");
      return res.json();
    },
  });

  const activeRunId = requestedRunId ?? agentRuns[0]?.id ?? null;

  useEffect(() => {
    if (!requestedRunId && agentRuns[0]?.id) {
      router.replace(`/agent?agentRunId=${agentRuns[0].id}`);
    }
  }, [requestedRunId, agentRuns, router]);

  const {
    data: activeRun,
    isLoading: runLoading,
    isError: runError,
  } = useAgentRunPolling(activeRunId);

  const selectedRun =
    agentRuns.find((run) => run.id === activeRunId) ?? agentRuns[0];

  const activeRunData = activeRun as
    | {
        status?: string;
        regressionFound?: boolean;
        previousScore?: number | null;
        newScore?: number | null;
        reportSummary?: string | null;
        deployment?: { threshold?: number };
        agentTrace?: Array<{
          node: string;
          timestamp: string;
          summary: string;
          status: "done" | "pending" | "running" | "error";
          reportSummary?: string | null;
        }>;
      }
    | undefined;

  const deploymentThreshold = activeRunData?.deployment?.threshold;

  if (listLoading || (activeRunId && runLoading)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 gap-6">
        <Skeleton className="h-[100px] w-full bg-[#111113]/50 rounded-lg" />
        <Skeleton className="h-[400px] w-full bg-[#111113]/50 rounded-lg" />
      </div>
    );
  }

  if (listError || runError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
      </div>
    );
  }

  if (!agentRuns || agentRuns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-sm text-muted-foreground">No agent runs yet. Trigger one from a deployment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 gap-6">
      <RegressionBanner
        regressionFound={activeRunData?.regressionFound ?? false}
        previousScore={activeRunData?.previousScore ?? 0}
        newScore={activeRunData?.newScore ?? 0}
        suiteName={selectedRun?.deployment?.name}
        modelId={selectedRun?.triggerEvent}
        reportSummary={activeRunData?.reportSummary}
      />

      <div>
        <h1 className="font-sans text-[20px] font-bold text-[#FAFAFA]">Agent Run</h1>
        <p className="font-sans text-[13px] text-[#71717A] mt-1">Run ID: {activeRunId}</p>
      </div>

      <div className="border border-[#1F1F23] rounded-lg p-4 bg-[#111113]">
        <p className="text-xs text-[#71717A]">Status</p>
        <p className="text-sm text-[#FAFAFA] mt-1">{activeRunData?.status ?? "running"}</p>
      </div>

      <AgentRunCard agentRun={selectedRun} />

      {activeRunData?.regressionFound === true &&
        deploymentThreshold !== undefined &&
        deploymentThreshold !== null &&
        activeRunData?.previousScore !== null &&
        activeRunData?.previousScore !== undefined &&
        activeRunData?.newScore !== null &&
        activeRunData?.newScore !== undefined && (
          <RegressionAlert
            previousScore={activeRunData.previousScore}
            newScore={activeRunData.newScore}
            threshold={deploymentThreshold}
            reportSummary={activeRunData.reportSummary ?? null}
          />
        )}

      <AgentTraceViewer agentTrace={activeRunData?.agentTrace ?? []} />
    </div>
  );
}

export default function AgentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 gap-6">
          <Skeleton className="h-[100px] w-full bg-[#111113]/50 rounded-lg" />
          <Skeleton className="h-[400px] w-full bg-[#111113]/50 rounded-lg" />
        </div>
      }
    >
      <AgentContent />
    </Suspense>
  );
}
