"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ModelRunForm } from "@/components/runs/ModelRunForm";
import { Skeleton } from "@/components/ui/skeleton";

interface SuiteDetail {
  id: string;
  name: string;
  testCases: { id: string }[];
}

interface RunDetail {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
}

function PageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 gap-6">
      <Skeleton className="h-[100px] w-full bg-[#111113]/50 rounded-lg" />
      <Skeleton className="h-[320px] w-full bg-[#111113]/50 rounded-lg" />
    </div>
  );
}

export default function RunEvalSuitePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedEvalMode, setSelectedEvalMode] = useState<
    "standard" | "rigorous" | "brutal"
  >("standard");
  const [activeRunId, setActiveRunId] = useState<string | null>(
    searchParams.get("runId")
  );

  const {
    data: suite,
    isLoading: suiteLoading,
    isError: suiteError,
  } = useQuery<SuiteDetail>({
    queryKey: ["suite", id],
    queryFn: async () => {
      const res = await fetch(`/api/suites/${id}`);
      if (!res.ok) throw new Error("Failed to fetch suite");
      return res.json();
    },
    enabled: !!id,
  });

  const startRun = useMutation({
    mutationFn: async (modelId: string) => {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suiteId: id, modelId, evalMode: selectedEvalMode }),
      });
      if (!res.ok) throw new Error("Failed to start run");
      return res.json() as Promise<{ runId: string }>;
    },
    onSuccess: ({ runId }) => {
      setActiveRunId(runId);
      router.replace(`/suites/${id}/run?runId=${runId}`);
    },
  });

  const {
    data: run,
    isLoading: runLoading,
    isError: runError,
  } = useQuery<RunDetail>({
    queryKey: ["run", activeRunId],
    queryFn: async () => {
      const res = await fetch(`/api/runs/${activeRunId}`);
      if (!res.ok) throw new Error("Failed to fetch run");
      return res.json();
    },
    enabled: !!activeRunId,
    refetchInterval: (query) => {
      const data = query.state.data as RunDetail | undefined;
      if (data?.status === "COMPLETED" || data?.status === "FAILED") return false;
      return 3000;
    },
  });

  useEffect(() => {
    if (run?.status === "COMPLETED" || run?.status === "FAILED") {
      router.push(`/runs/${run.id}`);
    }
  }, [run?.id, run?.status, router]);

  if (suiteLoading || (activeRunId && runLoading)) return <PageSkeleton />;

  if (suiteError || runError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
      </div>
    );
  }

  if (!suite || !suite.testCases || suite.testCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-sm text-muted-foreground">No test cases yet. Add your first test case below.</p>
      </div>
    );
  }

  const isRunning = startRun.isPending || run?.status === "RUNNING" || run?.status === "PENDING";

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 max-w-full">
      <div className="flex flex-col mb-8">
        <div className="font-sans text-[13px] text-[#52525B] mb-2">
          <Link href="/suites" className="hover:text-[#71717A] transition-colors">Eval Suites</Link> /
          <Link href={`/suites/${suite.id}`} className="hover:text-[#71717A] transition-colors mx-1">{suite.name}</Link> /
          Run
        </div>
        <h1 className="font-sans text-[24px] font-bold text-[#FAFAFA]">Run Eval Suite</h1>
        <span className="font-sans text-[14px] text-[#71717A] mt-1">
          {suite.name} · {suite.testCases.length} test cases
        </span>
      </div>

      <div className="flex gap-8 w-full">
        <div className="w-[58%]">
          <ModelRunForm
            selectedModelId={selectedModelId}
            onSelectModel={!isRunning ? setSelectedModelId : () => {}}
          />
        </div>

        <div className="w-[42%]">
          <div className="bg-[#111113] border border-[#1F1F23] rounded-lg p-6 sticky top-6">
            <h2 className="font-sans text-[14px] font-semibold text-[#FAFAFA] mb-4">Run Summary</h2>

            <div className="flex flex-col divide-y divide-[#1F1F23]">
              <div className="py-3 flex justify-between items-center">
                <span className="font-sans text-[13px] text-[#52525B]">Suite</span>
                <span className="font-sans text-[14px] font-medium text-[#FAFAFA]">{suite.name}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-sans text-[13px] text-[#52525B]">Model</span>
                <span className={`font-mono text-[14px] font-medium ${selectedModelId ? "text-[#8B5CF6]" : "text-[#52525B]"}`}>
                  {selectedModelId || "None selected"}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-sans text-[13px] text-[#52525B]">Test Cases</span>
                <span className="font-sans text-[14px] font-medium text-[#FAFAFA]">{suite.testCases.length}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-sans text-[13px] text-[#52525B]">Eval Mode</span>
                <select
                  value={selectedEvalMode}
                  onChange={(e) =>
                    setSelectedEvalMode(
                      e.target.value as "standard" | "rigorous" | "brutal"
                    )
                  }
                  disabled={isRunning}
                  className="bg-[#18181B] border border-[#27272A] rounded-md px-2 py-1 text-xs text-[#FAFAFA] disabled:opacity-60"
                >
                  <option value="standard">Standard</option>
                  <option value="rigorous">Rigorous</option>
                  <option value="brutal">Brutal</option>
                </select>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-sans text-[13px] text-[#52525B]">Judge</span>
                <span className="font-mono text-[14px] font-medium text-[#71717A]">GPT OSS 120B</span>
              </div>
            </div>

            <div className="mt-6">
              {!isRunning ? (
                <button
                  onClick={() => selectedModelId && startRun.mutate(selectedModelId)}
                  disabled={!selectedModelId || startRun.isPending}
                  className="w-full h-11 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg font-sans text-[14px] font-semibold text-white transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Run Evaluation Suite →
                </button>
              ) : (
                <span className="font-sans text-[13px] text-[#A1A1AA]">
                  Run in progress. Redirecting when finished...
                </span>
              )}
              {startRun.isError && (
                <p className="mt-2 text-sm text-[#EF4444]">Failed to start run. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
