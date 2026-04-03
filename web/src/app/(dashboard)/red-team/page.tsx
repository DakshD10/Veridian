"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { VulnerabilityBadge } from "@/components/red-team/VulnerabilityBadge";
import { useRedTeamRuns } from "@/hooks/useRedTeamRuns";
import type { RedTeamRun } from "@/types";

function StatusPill({ status }: { status: RedTeamRun["status"] }) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-amber-950/40 text-amber-400 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Running
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-green-950/40 text-green-400 border border-green-500/30">
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-red-950/40 text-red-400 border border-red-500/30">
      Error
    </span>
  );
}

export default function RedTeamRunsPage() {
  const { data: runs = [], isLoading, isError } = useRedTeamRuns({ limit: 50 });

  const stats = useMemo(() => {
    const completed = runs.filter((run) => run.status === "completed").length;
    const running = runs.filter((run) => run.status === "running").length;
    const critical = runs.reduce((sum, run) => sum + run.criticalFindings, 0);
    const succeeded = runs.reduce((sum, run) => sum + run.attacksSucceeded, 0);
    return { completed, running, critical, succeeded };
  }, [runs]);

  if (isLoading) {
    return (
      <PageLayout title="Red Team Runs" subtitle="Browse previous red team analyses">
        <div className="flex flex-col gap-3">
          <div className="h-14 rounded-lg bg-[#111113] border border-[#1F1F23] animate-pulse" />
          <div className="h-14 rounded-lg bg-[#111113] border border-[#1F1F23] animate-pulse" />
          <div className="h-14 rounded-lg bg-[#111113] border border-[#1F1F23] animate-pulse" />
        </div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout title="Red Team Runs" subtitle="Browse previous red team analyses">
        <div className="flex flex-col items-center gap-3 py-16 border border-[#27272A] rounded-lg bg-[#111113]">
          <p className="text-sm text-red-400">Failed to load red team run history</p>
          <p className="text-xs text-[#71717A]">Please refresh and try again.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Red Team Runs"
      subtitle={`${runs.length} historical run${runs.length !== 1 ? "s" : ""}`}
      stats={[
        { label: "TOTAL RUNS", value: runs.length },
        { label: "RUNNING", value: stats.running, color: "text-amber-400" },
        { label: "COMPLETED", value: stats.completed, color: "text-green-400" },
        { label: "CRITICAL FINDINGS", value: stats.critical, color: "text-red-400" },
      ]}
    >
      <div className="flex flex-col gap-3">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 border border-[#27272A] rounded-lg bg-[#111113]">
            <Shield size={24} className="text-[#71717A]" />
            <p className="text-sm text-[#A1A1AA] font-medium">No red team runs yet</p>
            <p className="text-xs text-[#71717A] text-center max-w-xs">
              Start a Red Team run from any suite detail page to see historical runs here.
            </p>
          </div>
        ) : (
          runs.map((run) => (
            <Link
              key={run.id}
              href={`/red-team/${run.id}`}
              className="group flex items-center justify-between gap-4 p-4 bg-[#111113] border border-[#1F1F23] rounded-lg hover:border-[#27272A] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {run.criticalFindings > 0 ? (
                  <ShieldAlert size={16} className="text-red-400 shrink-0" />
                ) : (
                  <ShieldCheck size={16} className="text-green-400 shrink-0" />
                )}

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-[#FAFAFA] truncate">
                      {run.suite?.name ?? "Unknown Suite"}
                    </span>
                    <StatusPill status={run.status} />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#71717A] min-w-0">
                    <span className="font-mono truncate">{run.modelId}</span>
                    <span>Generated: {run.attacksGenerated}</span>
                    <span>Succeeded: {run.attacksSucceeded}</span>
                    <div className="flex items-center gap-1">
                      <VulnerabilityBadge
                        severity={run.criticalFindings > 0 ? "CRITICAL" : "LOW"}
                        size="sm"
                      />
                      <span className="font-mono text-[#A1A1AA]">{run.criticalFindings}</span>
                    </div>
                    <span>{new Date(run.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <ChevronRight
                size={16}
                className="text-[#52525B] group-hover:text-[#A1A1AA] transition-colors shrink-0"
              />
            </Link>
          ))
        )}
      </div>

      {runs.length > 0 && (
        <p className="text-xs text-[#52525B] mt-4">
          Tip: Use any row to open full trace + findings report for that run.
          Total successful attacks across listed runs: {stats.succeeded}.
        </p>
      )}
    </PageLayout>
  );
}
