"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultsTable } from "@/components/runs/ResultsTable";

interface RunResult {
  id: string;
  testCaseId: string;
  modelOutput: string;
  overallScore: number;
  passed: boolean;
  latencyMs: number | null;
  metricScores: {
    id: string;
    metricName: string;
    score: number;
    passed: boolean;
    reason: string | null;
  }[];
  testCase: {
    id: string;
    input: string;
    expectedOutput: string;
  };
}

interface RunDetail {
  id: string;
  suiteId: string;
  modelId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  overallScore: number | null;
  passedCount: number;
  failedCount: number;
  suite: {
    id: string;
    name: string;
  };
  results: RunResult[];
}

function PageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0D] w-full gap-4">
      <Skeleton className="h-12 w-full bg-[#121215]/50 rounded-none" />
      <div className="px-8 mt-4 flex flex-col gap-4">
        <Skeleton className="h-12 w-full bg-[#121215]/50 rounded-lg" />
        <Skeleton className="h-[200px] w-full bg-[#121215]/50 rounded-lg" />
      </div>
    </div>
  );
}

export default function RunDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const {
    data: run,
    isLoading,
    isError,
  } = useQuery<RunDetail>({
    queryKey: ["run", id],
    queryFn: async () => {
      const res = await fetch(`/api/runs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch run");
      return res.json();
    },
    enabled: !!id,
  });

  const handleDownloadReport = async () => {
    setDownloadError(null);
    try {
      const response = await fetch(`/api/runs/${id}/report`);
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `run_report_${id}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Failed to download report. Please try again.");
    }
  };

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-sm text-muted-foreground">Run not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0D] w-full">
      <div className="sticky top-0 z-10 w-full h-12 bg-[#121215] border-b border-[#1F1F23] px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/runs" className="font-mono text-[13px] text-[#52525B] hover:text-[#71717A] transition-colors">
            Run History
          </Link>
          <span className="font-mono text-[13px] text-[#52525B] ml-1 mr-1">/</span>
          <span className="font-mono text-[13px] text-[#A1A1AA]">#{id}</span>
          <span className="font-mono text-[13px] text-[#52525B] ml-2">· {run.modelId}</span>
        </div>
        <button
          onClick={handleDownloadReport}
          className="border border-[#27272A] bg-transparent text-[#A1A1AA] rounded-lg px-4 py-1.5 font-sans font-medium text-[13px] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors cursor-pointer"
        >
          Download PDF Report ↓
        </button>
      </div>

      <div className="px-8 py-4 border-b border-[#1F1F23] flex gap-8 items-center w-full bg-[#0A0A0D]">
        <div className="font-sans font-normal text-[13px] text-[#71717A] pr-8 border-r border-[#1F1F23]">
          {run.results.length} test cases
        </div>
        <div className="font-sans font-normal text-[13px] text-[#22C55E] pr-8 border-r border-[#1F1F23]">
          {run.passedCount} passed
        </div>
        <div className="font-sans font-normal text-[13px] text-[#EF4444] pr-8 border-r border-[#1F1F23]">
          {run.failedCount} failed
        </div>
        <div className="font-mono text-[13px] text-[#A1A1AA]">
          Avg score {run.overallScore?.toFixed(2) ?? "0.00"}
        </div>
      </div>

      {downloadError && (
        <p className="px-8 pt-4 text-sm text-[#EF4444]">{downloadError}</p>
      )}

      <div className="px-8 pt-4 pb-16 w-full flex flex-col gap-3">
        {!run.results || run.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
            <p className="text-sm text-muted-foreground">This run has no results yet.</p>
          </div>
        ) : (
          <ResultsTable results={run.results} />
        )}
      </div>
    </div>
  );
}
