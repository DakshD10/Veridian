"use client";

import { useRuns } from "@/hooks/useRuns";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import Link from "next/link";
import type { EvalRun } from "@/types";

type RunListItem = EvalRun & {
  overallScore: number | null;
  suite?: { name: string } | null;
};

export default function RunsPage() {
  const { data, isLoading, isError } = useRuns();
  const router = useRouter();
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
      case "healthcare": return "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20";
      case "bfsi": return "bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20";
      case "hiring": return "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20";
      default: return "bg-[#71717A]/10 text-[#71717A] border border-[#71717A]/20";
    }
  };

  const renderScoreBlock = (score: number | null, delta: number | null) => {
    if (score === null) return <span className="text-[#3F3F46] font-mono font-bold text-[14px]">—</span>;

    let tintClass = "";
    if (score >= 0.75) tintClass = "bg-[rgba(34,197,94,0.12)] text-[#22C55E]";
    else if (score >= 0.50) tintClass = "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]";
    else tintClass = "bg-[rgba(239,68,68,0.12)] text-[#EF4444]";

    return (
      <div className={`rounded px-3 py-1.5 inline-flex flex-col items-center w-[80px] ${tintClass}`}>
        <span className="font-mono font-bold text-[14px] leading-none">{score.toFixed(2)}</span>
        <div className="flex w-full items-center justify-center min-h-[14px]">
          {delta !== null && (
            <span className={`font-mono text-[11px] leading-none mt-0.5 ${delta >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {delta >= 0 ? "+" : "−"}{Math.abs(delta).toFixed(2)}
            </span>
          )}
        </div>
        <div className="w-full h-[3px] bg-[#1F1F23]/50 rounded mt-1 overflow-hidden">
          <div className="h-full bg-current rounded" style={{ width: `${score * 100}%` }} />
        </div>
      </div>
    );
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <div className="bg-[rgba(34,197,94,0.1)] text-[#22C55E] rounded px-2 py-1 font-mono text-[12px] inline-flex items-center gap-1.5 w-max">
             <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Completed
          </div>
        );
      case "RUNNING":
        return (
          <div className="bg-[rgba(245,158,11,0.1)] text-[#F59E0B] rounded px-2 py-1 font-mono text-[12px] inline-flex items-center gap-1.5 w-max">
             <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" /> Running
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
          <div className="bg-[rgba(239,68,68,0.1)] text-[#EF4444] rounded px-2 py-1 font-mono text-[12px] inline-flex items-center gap-1.5 w-max">
             ✕ Failed
          </div>
        );
    }
  };

  const chips = ["All Suites ▾", "All Models ▾", "All Status ▾", "Last 30 days ▾"];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading runs...</div>;
  if (isError) return <div className="p-8 text-center text-destructive">Failed to load runs.</div>;
  if (runs.length === 0) return <div className="p-8 text-center text-muted-foreground">No runs yet.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8">
      {/* Top Layout */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-sans text-[20px] font-bold text-[#FAFAFA]">Run History</h1>
          <p className="font-sans text-[14px] text-[#71717A] mt-1">
            {`${runs.length} run${runs.length !== 1 ? "s" : ""} across ${suiteCount} suite${suiteCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link 
          href="/suites"
          className="bg-[#8B5CF6] text-white rounded-lg px-4 py-2 font-sans font-medium text-[14px] hover:bg-violet-600 transition-colors cursor-pointer"
        >
          + New Evaluation
        </Link>
      </div>

      {/* FILTER CHIPS ROW */}
      <div className="flex justify-between items-center mt-6 mb-4">
        <div className="flex gap-2">
          {chips.map((chip, idx) => (
            <div 
              key={chip} 
              className={`rounded px-3 py-1.5 font-sans font-medium text-[13px] border cursor-pointer transition-colors ${
                idx === 0 
                  ? "bg-[rgba(139,92,246,0.12)] border-[#8B5CF6] text-[#8B5CF6]" 
                  : "bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]"
              }`}
            >
              {chip}
            </div>
          ))}
        </div>
        <span className="font-sans text-[13px] text-[#52525B]">{runs.length} runs</span>
      </div>

      {/* RUNS TABLE */}
      <div className="w-full bg-[#111113] border border-[#1F1F23] rounded-lg overflow-hidden flex flex-col">
        <div className="bg-[#18181B] border-b border-[#1F1F23] px-6 py-3 grid grid-cols-[100px_1fr_180px_140px_120px_80px] gap-4 items-center">
          {["RUN ID", "SUITE", "MODEL", "SCORE", "STATUS", "DATE"].map((col) => (
            <span key={col} className="font-sans font-medium text-[11px] text-[#52525B] uppercase tracking-wider">{col}</span>
          ))}
        </div>

        <div className="flex flex-col">
          {runs.map((run) => {
            const isRunning = run.status === "RUNNING";
            const suiteName = run.suite?.name ?? run.suiteId;
            const modelVersion = run.modelVersion ?? "default";
            const formattedDate = new Date(run.createdAt).toLocaleDateString();

            return (
              <div
                key={run.id}
                onClick={() => router.push(`/runs/${run.id}`)}
                className={`px-6 py-4 border-b border-[#1F1F23] last:border-0 grid grid-cols-[100px_1fr_180px_140px_120px_80px] gap-4 items-center hover:bg-[#18181B] cursor-pointer transition-colors ${
                  isRunning ? "border border-t border-b border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.03)]" : ""
                }`}
              >
                <div className="font-mono text-[13px] text-[#8B5CF6]">#{run.id}</div>

                <div className="flex flex-col items-start gap-1 justify-center min-w-0">
                  <span className="font-sans text-[14px] text-[#FAFAFA] truncate w-full">{suiteName}</span>
                  <span className={`font-sans text-[10px] uppercase font-medium px-1.5 py-0.5 rounded leading-none ${getDomainBadge("default")}`}>
                    SUITE
                  </span>
                </div>

                <div className="flex flex-col items-start justify-center min-w-0">
                  <span className="font-mono text-[13px] text-[#A1A1AA] truncate w-full">{run.modelId}</span>
                  <span className="font-sans text-[10px] text-[#52525B] mt-0.5">{modelVersion}</span>
                </div>

                <div>
                  {renderScoreBlock(run.overallScore, null)}
                </div>

                <div>
                  {renderStatus(run.status)}
                </div>

                <div className="font-sans text-[13px] text-[#52525B] flex items-center">
                  {run.triggeredBy === "agent" && <Bot className="w-3 h-3 mr-1.5 text-[#52525B]" />}
                  <span className="font-mono">{formattedDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM STATS BAR */}
      <div className="mt-4 grid grid-cols-4 gap-4 pb-8 w-full">
        <div className="bg-[#111113] border border-[#1F1F23] rounded-lg px-6 py-4 flex flex-col justify-center">
          <span className="font-sans text-[12px] text-[#52525B] uppercase tracking-wide">TOTAL CASES EVALUATED</span>
          <span className="font-mono font-bold text-[20px] text-[#FAFAFA] mt-1">{totalCases}</span>
        </div>
        <div className="bg-[#111113] border border-[#1F1F23] rounded-lg px-6 py-4 flex flex-col justify-center">
          <span className="font-sans text-[12px] text-[#52525B] uppercase tracking-wide">PASS RATE</span>
          <span className="font-mono font-bold text-[20px] text-[#22C55E] mt-1">{passRate.toFixed(1)}%</span>
        </div>
        <div className="bg-[#111113] border border-[#1F1F23] rounded-lg px-6 py-4 flex flex-col justify-center">
          <span className="font-sans text-[12px] text-[#52525B] uppercase tracking-wide">AVG. SCORE</span>
          <span className="font-mono font-bold text-[20px] text-[#FAFAFA] mt-1">{avgScore.toFixed(2)}</span>
        </div>
        <div className="bg-[#111113] border border-[#1F1F23] rounded-lg px-6 py-4 flex flex-col justify-center">
          <span className="font-sans text-[12px] text-[#52525B] uppercase tracking-wide">SUCCESS RATE</span>
          <span className="font-mono font-bold text-[20px] text-[#22C55E] mt-1">{successRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
