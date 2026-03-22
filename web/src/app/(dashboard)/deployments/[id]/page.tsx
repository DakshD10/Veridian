"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentRunSummary {
  id: string;
  status: string;
  triggerEvent: string;
  createdAt: string;
  regressionFound: boolean;
}

interface DeploymentDetail {
  id: string;
  name: string;
  currentModel: string;
  threshold: number;
  suite: { name: string };
  agentRuns: AgentRunSummary[];
}

function PageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 gap-6">
      <Skeleton className="h-4 w-[150px] bg-[#111113]/50 rounded" />
      <Skeleton className="h-8 w-[250px] bg-[#111113]/50 rounded" />
      <Skeleton className="h-[250px] w-full bg-[#111113]/50 rounded-lg" />
    </div>
  );
}

export default function DeploymentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    data: deployment,
    isLoading,
    isError,
  } = useQuery<DeploymentDetail>({
    queryKey: ["deployment", id],
    queryFn: async () => {
      const res = await fetch(`/api/deployments/${id}`);
      if (!res.ok) throw new Error("Failed to fetch deployment");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-sm text-muted-foreground">Deployment not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 max-w-[1232px]">
      <Link
        href="/deployments"
        className="text-[#71717A] hover:text-[#FAFAFA] transition-colors font-sans text-[13px] mb-6 w-fit"
      >
        ← Back to Deployments List
      </Link>

      <div className="border border-[#1F1F23] rounded-xl bg-[#111113] p-6">
        <h1 className="text-[20px] font-bold text-[#FAFAFA] font-sans">{deployment.name}</h1>
        <p className="text-[13px] text-[#71717A] mt-1">Suite: {deployment.suite.name}</p>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="border border-[#1F1F23] rounded-lg p-4 bg-[#09090B]">
            <p className="text-xs text-[#52525B] uppercase">Current Model</p>
            <p className="text-sm font-mono text-[#A1A1AA] mt-1">{deployment.currentModel}</p>
          </div>
          <div className="border border-[#1F1F23] rounded-lg p-4 bg-[#09090B]">
            <p className="text-xs text-[#52525B] uppercase">Threshold</p>
            <p className="text-sm font-mono text-[#A1A1AA] mt-1">{deployment.threshold.toFixed(2)}</p>
          </div>
          <div className="border border-[#1F1F23] rounded-lg p-4 bg-[#09090B]">
            <p className="text-xs text-[#52525B] uppercase">Recent Agent Runs</p>
            <p className="text-sm font-mono text-[#A1A1AA] mt-1">{deployment.agentRuns.length}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-[#FAFAFA] mb-3">Recent Agent Runs</h2>
          {!deployment.agentRuns || deployment.agentRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
              <p className="text-sm text-muted-foreground">No agent runs yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deployment.agentRuns.map((agentRun) => (
                <div key={agentRun.id} className="border border-[#1F1F23] rounded-lg p-3 bg-[#09090B]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#FAFAFA]">{agentRun.triggerEvent}</p>
                    <p className="text-xs text-[#71717A]">{new Date(agentRun.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-xs mt-1 text-[#A1A1AA]">
                    Status: {agentRun.status} {agentRun.regressionFound ? "· Regression found" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
