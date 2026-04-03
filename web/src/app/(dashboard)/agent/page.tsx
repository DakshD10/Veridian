"use client";

import { useEffect, Suspense, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AgentTraceViewer } from "@/components/agent/AgentTraceViewer";
import { AgentPipelineHeader } from "@/components/agent/AgentPipelineHeader";
import { LiveTimer } from "@/components/agent/LiveTimer";
import { useAgentRunPolling } from "@/hooks/useAgentRunPolling";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentMetricsPanel } from "@/components/agent/AgentMetricsPanel";
import { PageLayout } from "@/components/layout/PageLayout";
import { RootCauseCard } from "@/components/agent/RootCauseCard";

// Add CSS for regression pulse animation
const regressionPulseCSS = `
@keyframes regressionPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}`;

if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = regressionPulseCSS;
  document.head.appendChild(style);
}

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

function toRunStatus(status: string): "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" {
  const normalized = status.toUpperCase();
  if (normalized === "RUNNING") return "RUNNING";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "FAILED" || normalized === "ERROR") return "FAILED";
  return "PENDING";
}

function AgentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedRunId = searchParams.get("agentRunId");
  const [showCompletionFlash, setShowCompletionFlash] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);

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
        rootCause?: string | null;
        decision?: string | null;
        deployment?: { threshold?: number };
        evalRun?: { id?: string | null } | null;
        agentTrace?: Array<{
          node: string;
          timestamp: string;
          summary: string;
          status: "done" | "pending" | "running" | "error";
          reportSummary?: string | null;
        }>;
      }
    | undefined;

  // Track completion flash
  useEffect(() => {
    const currentStatus = activeRunData?.status;
    if (prevStatusRef.current === "running" && currentStatus === "completed") {
      // Use requestAnimationFrame to avoid synchronous setState
      requestAnimationFrame(() => {
        setShowCompletionFlash(true);
        setTimeout(() => setShowCompletionFlash(false), 600);
      });
    }
    prevStatusRef.current = currentStatus;
  }, [activeRunData?.status]);

  const deploymentThreshold = activeRunData?.deployment?.threshold;
  const evalRunId = activeRunData?.evalRun?.id;
  const canViewReport = Boolean(
    evalRunId ||
      activeRunData?.reportSummary ||
      activeRunData?.agentTrace?.some(
        (step) => step.node === "generate_report" && step.status === "done"
      )
  );

  const handleViewReport = () => {
    if (evalRunId) {
      router.push(`/runs/${evalRunId}`);
      return;
    }

    const generateReportNode = document.getElementById("node-generate_report");
    if (generateReportNode) {
      generateReportNode.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (listLoading || (activeRunId && runLoading)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A0A0D] w-full">
        <Skeleton className="h-56 w-full bg-[#121215]/50" />
        <div className="max-w-[1100px] mx-auto px-6 py-5">
          <div className="flex gap-5">
            <div className="flex-1">
              <Skeleton className="h-[400px] w-full bg-[#121215]/50 rounded-xl" />
            </div>
            <div className="w-[340px]">
              <Skeleton className="h-[400px] w-full bg-[#121215]/50 rounded-xl" />
            </div>
          </div>
        </div>
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
    <div className="min-h-screen bg-[#0A0A0D] w-full">
      {/* Completion Flash */}
      <AnimatePresence>
        {showCompletionFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 bg-white pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      {/* ZONE 1 — COMMAND BAR */}
      <div className="sticky top-0 z-50 h-14 bg-[#0A0A0D]/95 backdrop-blur-md border-b border-[#1A1A1E] flex items-center justify-between px-6">
        {/* LEFT SIDE: Breadcrumb */}
        <div className="flex items-center gap-1 text-[12px] font-mono">
          <span className="text-[#52525B]">Deployments</span>
          <span className="text-[#27272A]">/</span>
          <span className="text-[#52525B]">Triage AI</span>
          <span className="text-[#27272A]">/</span>
          <span className="text-[#A1A1AA]">Agent Run</span>
        </div>

        {/* CENTER: Progress Pipeline */}
        <div className="flex items-center gap-1">
          <AgentPipelineHeader agentTrace={activeRunData?.agentTrace ?? []} />
        </div>

        {/* RIGHT SIDE: Timer, Status, Actions */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[9px] text-[#52525B]">duration</div>
            <div className="font-mono font-bold text-[14px] text-[#FAFAFA]">
              {activeRunData?.status === "running" ? (
                <LiveTimer startTime={selectedRun?.createdAt} />
              ) : activeRunData?.status === "completed" ? (
                "Completed"
              ) : (
                "0:00"
              )}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[11px] font-mono border ${
            activeRunData?.status === "running" 
              ? "bg-violet-950/60 border-violet-700 text-violet-300 animate-pulse" 
              : activeRunData?.status === "completed"
              ? "bg-green-950/60 border-green-800 text-green-500"
              : "bg-[#1A1A1E] border-[#27272A] text-[#3F3F46]"
          }`}>
            {toRunStatus(activeRunData?.status || "")}
          </div>
          <button
            type="button"
            onClick={handleViewReport}
            disabled={!canViewReport}
            className={`border text-[11px] font-mono px-3 py-1 rounded transition ${
              canViewReport
                ? "border-[#27272A] text-[#A1A1AA] hover:border-violet-500/40 hover:text-[#FAFAFA]"
                : "border-[#1F1F23] text-[#52525B] cursor-not-allowed"
            }`}
          >
            View Report →
          </button>
        </div>
      </div>

      {/* ZONE 2 — HERO STATS ROW */}
      <div className="bg-[#0A0A0D] border-b border-[#1A1A1E] py-5 px-6">
        <div className="max-w-[1100px] mx-auto flex">
          {/* PREVIOUS SCORE */}
          <motion.div 
            className="flex flex-col gap-1 px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.06 }}
          >
            <div className="text-[10px] font-mono text-[#52525B] uppercase tracking-widest">Previous Score</div>
            <div className="font-mono font-bold text-[28px] text-green-500">
              {selectedRun?.previousScore?.toFixed(2) || "--"}
            </div>
            <div className="text-[10px] text-[#3F3F46]">baseline</div>
          </motion.div>

          <div className="w-px bg-[#1A1A1E]" />

          {/* NEW SCORE */}
          <motion.div 
            className="flex flex-col gap-1 px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.12 }}
          >
            <div className="text-[10px] font-mono text-[#52525B] uppercase tracking-widest">New Score</div>
            <div className={`font-mono font-bold text-[28px] ${
              selectedRun?.regressionFound ? "text-red-400" : "text-green-500"
            }`}>
              {selectedRun?.newScore?.toFixed(2) || "--"}
            </div>
            <div className="text-[10px] text-[#3F3F46] truncate">
              {selectedRun?.triggerEvent || "Unknown model"}
            </div>
          </motion.div>

          <div className="w-px bg-[#1A1A1E]" />

          {/* DELTA */}
          <motion.div 
            className="flex flex-col gap-1 px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            <div className="text-[10px] font-mono text-[#52525B] uppercase tracking-widest">Delta</div>
            <div className={`font-mono font-bold text-[28px] ${
              selectedRun?.previousScore && selectedRun?.newScore 
                ? (selectedRun.newScore - selectedRun.previousScore) >= 0 
                  ? "text-green-500" 
                  : "text-red-400"
                : "text-[#52525B]"
            }`}>
              {selectedRun?.previousScore && selectedRun?.newScore 
                ? (selectedRun.newScore - selectedRun.previousScore) >= 0 
                  ? `+${((selectedRun.newScore - selectedRun.previousScore)).toFixed(2)}`
                  : ((selectedRun.newScore - selectedRun.previousScore)).toFixed(2)
                : "--"
              }
            </div>
            <div className="text-[10px] text-[#3F3F46]">vs threshold</div>
          </motion.div>

          <div className="w-px bg-[#1A1A1E]" />

          {/* THRESHOLD */}
          <motion.div 
            className="flex flex-col gap-1 px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.24 }}
          >
            <div className="text-[10px] font-mono text-[#52525B] uppercase tracking-widest">Threshold</div>
            <div className="font-mono font-bold text-[28px] text-amber-500">
              {deploymentThreshold?.toFixed(2) || "--"}
            </div>
            <div className="text-[10px] text-[#3F3F46]">minimum quality</div>
          </motion.div>

          <div className="w-px bg-[#1A1A1E]" />

          {/* DECISION */}
          <motion.div 
            className="flex flex-col gap-1 px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.30 }}
          >
            <div className="text-[10px] font-mono text-[#52525B] uppercase tracking-widest">Decision</div>
            <div className={`font-mono font-bold text-[24px] ${
              selectedRun?.decision === "PASS" ? "text-green-500" : "text-red-400"
            }`}>
              {selectedRun?.decision || "--"}
            </div>
            {selectedRun?.regressionFound && (
              <div className="bg-red-950/60 text-red-400 border border-red-900 text-[9px] font-mono px-2 py-0.5 rounded">
                Regression
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* REGRESSION BANNER */}
      <AnimatePresence>
        {selectedRun?.regressionFound && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 40 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full overflow-hidden"
          >
            <div 
              className="h-full bg-gradient-to-r from-[#1A0505] via-[#2D0A0A] to-[#1A0505] border-t border-b border-red-900/20 flex items-center justify-center"
              style={{ animation: 'regressionPulse 3s ease-in-out infinite' }}
            >
              <span className="text-[12px] font-mono text-red-400">
                ⚠ REGRESSION DETECTED — Score dropped from {selectedRun.previousScore?.toFixed(2)} to {selectedRun.newScore?.toFixed(2)} · Rollback recommended
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZONE 3 — MAIN CONTENT GRID */}
      <div className="grid grid-cols-[1fr_340px] gap-5 pt-6 pb-16 max-w-[1100px] mx-auto px-6">
        {/* LEFT COLUMN — TRACE TIMELINE */}
        <div>
          <div className="text-[11px] font-mono text-[#52525B] uppercase tracking-widest mb-4">
            Execution Trace
          </div>
          <AgentTraceViewer
            agentTrace={activeRunData?.agentTrace ?? []}
            rootCause={activeRunData?.rootCause ?? null}
            reportSummary={activeRunData?.reportSummary ?? null}
          />
          {activeRunData?.status === "completed" && (
            <div className="mt-4">
              <RootCauseCard
                rootCause={activeRunData?.rootCause}
                failureClusters={
                  activeRunData?.agentTrace
                    ?.find((n) => n.node === "root_cause_analysis")
                    ?.summary
                    ? []
                    : []
                }
                regressionFound={activeRunData?.regressionFound ?? false}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — LIVE METRICS PANEL */}
        <div>
          <div className="text-[11px] font-mono text-[#52525B] uppercase tracking-widest mb-4">
            Run Metrics
          </div>
          <AgentMetricsPanel 
            agentRun={selectedRun}
            agentTrace={activeRunData?.agentTrace ?? []}
            deploymentThreshold={deploymentThreshold}
          />
        </div>
      </div>
    </div>
  );
}

export default function AgentPage() {
  return (
    <Suspense
      fallback={
        <PageLayout title="Agent">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex gap-5">
              <div className="flex-1">
                <Skeleton className="h-[400px] w-full bg-[#121215]/50 rounded-xl" />
              </div>
              <div className="w-[340px]">
                <Skeleton className="h-[400px] w-full bg-[#121215]/50 rounded-xl" />
              </div>
            </div>
          </div>
        </PageLayout>
      }
    >
      <AgentContent />
    </Suspense>
  );
}
