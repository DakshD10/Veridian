"use client";

import { useRuns } from "@/hooks/useRuns";
import { useRouter } from "next/navigation";
import { Bot, ChevronDown } from "lucide-react";
import type { EvalRun } from "@/types";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";

type RunListItem = EvalRun & {
  overallScore: number | null;
  suite?: { name: string } | null;
};

function RunsPageSkeleton() {
  return (
    <PageLayout
      title="Run History"
      subtitle="Loading runs..."
      stats={[
        { label: "TOTAL CASES", value: "--" },
        { label: "PASS RATE", value: "--" },
        { label: "AVG SCORE", value: "--" },
        { label: "SUCCESS RATE", value: "--" },
      ]}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 bg-[#121215]/50 rounded-md" />
          <Skeleton className="h-8 w-24 bg-[#121215]/50 rounded-md" />
          <Skeleton className="h-8 w-24 bg-[#121215]/50 rounded-md" />
          <Skeleton className="h-8 w-24 bg-[#121215]/50 rounded-md" />
        </div>
        <Skeleton className="h-4 w-16 bg-[#121215]/50 rounded" />
      </div>

      <div className="w-full bg-[#111113] border border-[#1F1F23] rounded-lg overflow-hidden">
        <div className="border-b border-[#1F1F23] px-6 py-4">
          <Skeleton className="h-3 w-60 bg-[#121215]/50 rounded" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-14 w-full bg-[#121215]/50 rounded-md" />
          <Skeleton className="h-14 w-full bg-[#121215]/50 rounded-md" />
          <Skeleton className="h-14 w-full bg-[#121215]/50 rounded-md" />
          <Skeleton className="h-14 w-full bg-[#121215]/50 rounded-md" />
          <Skeleton className="h-14 w-full bg-[#121215]/50 rounded-md" />
        </div>
      </div>
    </PageLayout>
  );
}

export default function RunsPage() {
  const { data, isLoading, isError } = useRuns();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const runs = (data ?? []) as RunListItem[];
  const completedRuns = runs.filter((run) => run.status === "COMPLETED");
  const totalCases = runs.reduce((sum, run) => sum + (run.passedCount + run.failedCount), 0);
  const passRate = completedRuns.length > 0
    ? (completedRuns.filter((run) => (run.overallScore ?? 0) >= 0.5).length / completedRuns.length) * 100
    : 0;
  const scoredRuns = runs.filter((run): run is RunListItem & { overallScore: number } => run.overallScore != null);
  const avgScore = scoredRuns.reduce((sum, run) => sum + run.overallScore, 0) / (scoredRuns.length || 1);
  const successRate = runs.length > 0 ? (completedRuns.length / runs.length) * 100 : 0;
  const suiteCount = new Set(runs.map((run) => run.suiteId)).size;

  const getDomainBadge = (domain: string) => {
    switch(domain) {
      case "healthcare": return "bg-blue-950/60 text-blue-400 border border-blue-900";
      case "bfsi": return "bg-amber-950/60 text-amber-400 border border-amber-900";
      case "hiring": return "bg-violet-950/60 text-violet-400 border border-violet-900";
      default: return "bg-[#1F1F23] text-[#71717A] border border-[#27272A]";
    }
  };

  const renderScoreBlock = (score: number | null, delta: number | null, index: number) => {
    if (score === null) return <span className="text-[#3F3F46] font-mono">—</span>;

    let tintClass = "";
    if (score >= 0.75) tintClass = "bg-[rgba(34,197,94,0.12)] text-[#22C55E]";
    else if (score >= 0.50) tintClass = "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]";
    else tintClass = "bg-[rgba(239,68,68,0.12)] text-[#EF4444]";

    return (
      <div className={`rounded-md px-3 py-1.5 inline-flex flex-col items-center w-[80px] ${tintClass}`}>
        <span className="font-mono font-bold text-[16px] leading-none">{score.toFixed(2)}</span>
        <div className="flex w-full items-center justify-center min-h-[14px]">
          {delta !== null && (
            <span className={`font-mono text-[11px] leading-none mt-0.5 ${delta >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {delta >= 0 ? "+" : "−"}{Math.abs(delta).toFixed(2)}
            </span>
          )}
        </div>
        <div className="w-full h-[3px] bg-[#1F1F23]/50 rounded mt-1 overflow-hidden">
          <motion.div 
            className="h-full bg-current rounded" 
            initial={{ width: "0%" }}
            animate={{ width: `${score * 100}%` }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: index * 0.04 + 0.2 }}
          />
        </div>
      </div>
    );
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <div className="bg-green-950/60 text-green-400 border border-green-900 font-mono text-[11px] px-2.5 py-[3px] rounded">
            Completed
          </div>
        );
      case "RUNNING":
        return (
          <div className="bg-violet-950/60 text-violet-400 border border-violet-900 font-mono text-[11px] px-2.5 py-[3px] rounded inline-flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Running
          </div>
        );
      case "PENDING":
        return (
          <div className="bg-[rgba(113,113,122,0.1)] text-[#71717A] rounded px-2 py-1 font-mono text-[12px] inline-flex items-center gap-1.5 w-max">
             <div className="w-1.5 h-1.5 rounded-full border border-[#71717A]" /> Pending
          </div>
        );
      case "FAILED":
        return (
          <div className="bg-red-950/60 text-red-400 border border-red-900 font-mono text-[11px] px-2.5 py-[3px] rounded">
            × Failed
          </div>
        );
    }
  };

  const handleCopyId = async (fullId: string) => {
    await navigator.clipboard.writeText(fullId);
    setCopiedId(fullId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const truncateId = (id: string) => {
    return `#${id.substring(0, 8)}...`;
  };

  const chips = ["All Suites", "All Models", "All Status", "Last 30 days"];

  if (isLoading) return <RunsPageSkeleton />;
  if (isError) return <div className="p-8 text-center text-destructive">Failed to load runs.</div>;
  if (runs.length === 0) return <div className="p-8 text-center text-muted-foreground">No runs yet.</div>;

  return (
    <PageLayout 
      title="Run History"
      subtitle={`${runs.length} run${runs.length !== 1 ? "s" : ""} across ${suiteCount} suite${suiteCount !== 1 ? "s" : ""}`}
      actionButton={{ href: "/suites", label: "New Evaluation" }}
      stats={[
        { label: "TOTAL CASES", value: totalCases },
        { label: "PASS RATE", value: `${passRate.toFixed(1)}%`, color: "text-[#22C55E]" },
        { label: "AVG SCORE", value: avgScore.toFixed(2) },
        { label: "SUCCESS RATE", value: `${successRate.toFixed(1)}%`, color: "text-[#22C55E]" }
      ]}
    >
      {/* FILTER CHIPS ROW */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {chips.map((chip, idx) => (
            <div 
              key={chip} 
              className={`bg-[#111113] border border-[#27272A] text-[#A1A1AA] text-sm px-3 py-1.5 rounded-md hover:border-[#3F3F46] hover:text-[#FAFAFA] transition-colors inline-flex items-center gap-1 cursor-pointer ${
                idx === 0 ? "border-violet-500/50 text-violet-400" : ""
              }`}
            >
              {chip}
              <ChevronDown size={12} className="text-[#52525B]" />
            </div>
          ))}
        </div>
        <span className="font-sans text-[13px] text-[#52525B]">{runs.length} runs</span>
      </div>

      {/* RUNS TABLE */}
      <div className="w-full bg-[#111113] border border-[#1F1F23] rounded-lg overflow-hidden">
        <table className="table-fixed w-full">
          <thead>
            <tr className="border-b border-[#1F1F23]">
              <th className="w-[180px] min-w-[180px] py-0 pb-3 text-[11px] font-mono text-[#52525B] uppercase tracking-widest text-left px-6">RUN ID</th>
              <th className="w-[260px] py-0 pb-3 text-[11px] font-mono text-[#52525B] uppercase tracking-widest text-left px-6">SUITE</th>
              <th className="w-[200px] py-0 pb-3 text-[11px] font-mono text-[#52525B] uppercase tracking-widest text-left px-6">MODEL</th>
              <th className="w-[120px] py-0 pb-3 text-[11px] font-mono text-[#52525B] uppercase tracking-widest text-center px-6">SCORE</th>
              <th className="w-[140px] py-0 pb-3 text-[11px] font-mono text-[#52525B] uppercase tracking-widest text-center px-6">STATUS</th>
              <th className="w-[120px] py-0 pb-3 text-[11px] font-mono text-[#52525B] uppercase tracking-widest text-right px-6">DATE</th>
            </tr>
          </thead>
          <tbody>
          {runs.map((run, index) => {
            const isRunning = run.status === "RUNNING";
            const suiteName = run.suite?.name ?? run.suiteId;
            const modelVersion = run.modelVersion ?? "default";
            const formattedDate = new Date(run.createdAt).toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric", 
              year: "numeric" 
            });
            const fullId = `#${run.id}`;
            const truncatedId = truncateId(run.id);
            const isCopied = copiedId === fullId;

            return (
              <motion.tr
                key={run.id}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                onClick={() => router.push(`/runs/${run.id}`)}
                className={`h-16 border-b border-[#1F1F23] hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer ${
                  isRunning ? "border border-t border-b border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.03)]" : ""
                }`}
              >
                <td className="px-6 py-0">
                  <div className="flex items-center gap-2">
                    <div 
                      className="font-mono text-xs text-violet-400 cursor-pointer hover:text-violet-300 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyId(fullId);
                      }}
                      title={fullId}
                    >
                      {truncatedId}
                    </div>
                    {isCopied && (
                      <span className="text-xs text-green-400 font-mono">Copied</span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm text-[#FAFAFA] truncate">{suiteName}</span>
                    <span className={`font-sans text-[11px] font-medium uppercase tracking-wide px-2 py-[3px] rounded ${getDomainBadge("default")}`}>
                      SUITE
                    </span>
                  </div>
                </td>

                <td className="px-6 py-0">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-[#FAFAFA]">{run.modelId}</span>
                    <span className="font-mono text-[11px] text-[#52525B]">{modelVersion}</span>
                  </div>
                </td>

                <td className="px-6 py-0 text-center">
                  {renderScoreBlock(run.overallScore, null, index)}
                </td>

                <td className="px-6 py-0 text-center">
                  {renderStatus(run.status)}
                </td>

                <td className="px-6 py-0 text-right">
                  <div className="flex items-center justify-end">
                    {run.triggeredBy === "agent" && <Bot className="w-3 h-3 mr-1.5 text-[#52525B]" />}
                    <span className="text-[#71717A] text-sm font-mono">{formattedDate}</span>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </PageLayout>
  );
}
