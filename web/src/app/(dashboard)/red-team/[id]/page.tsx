"use client";

import { useState } from "react";
import { use } from "react";
import { AgentTraceViewer } from "@/components/agent/AgentTraceViewer";
import { FindingsTable } from "@/components/red-team/FindingsTable";
import { RedTeamRunCard } from "@/components/red-team/RedTeamRunCard";
import { useRedTeamPolling } from "@/hooks/useRedTeamPolling";
import type { RedTeamVulnerability } from "@/types";

const RED_TEAM_NODES = [
  { name: "load_targets", label: "load_targets" },
  { name: "generate_attacks", label: "generate_attacks" },
  { name: "execute_attacks", label: "execute_attacks" },
  { name: "analyze_vulnerabilities", label: "analyze_vulnerabilities" },
  { name: "generate_red_team_report", label: "generate_red_team_report" },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RedTeamRunPage({ params }: PageProps) {
  const { id } = use(params);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { data: run, isLoading, error } = useRedTeamPolling(id);

  const handleDownloadReport = async () => {
    setDownloadError(null);
    try {
      const response = await fetch(`/api/red-team-runs/${id}/report`);
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `red_team_report_${id}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Failed to download report. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 max-w-4xl">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-40 rounded bg-[#111113] animate-pulse" />
          <div className="h-4 w-80 rounded bg-[#111113] animate-pulse" />
        </div>
        <div className="h-44 rounded-lg bg-[#111113] animate-pulse" />
        <div className="flex flex-col gap-3">
          <div className="h-5 w-24 rounded bg-[#111113] animate-pulse" />
          <div className="h-80 rounded-lg bg-[#111113] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex flex-col gap-4 p-8 max-w-4xl">
        <h1 className="text-[#FAFAFA] text-2xl font-semibold">Red Team Run</h1>
        <div className="flex flex-col items-center gap-3 py-16 border border-[#27272A] rounded-lg">
          <p className="text-sm text-red-400">Failed to load red team run</p>
          <p className="text-xs text-[#71717A]">{error?.message ?? "Run not found"}</p>
        </div>
      </div>
    );
  }

  const findings = (run.findings as RedTeamVulnerability[]) ?? [];

  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#FAFAFA] text-2xl font-semibold">Red Team Run</h1>
          <p className="text-[#71717A] text-sm">
            {run.suite?.name ?? "Unknown Suite"} · adversarial security analysis
          </p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="border border-[#27272A] bg-transparent text-[#A1A1AA] rounded-lg px-4 py-1.5 font-sans font-medium text-[13px] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors cursor-pointer"
        >
          Download PDF Report ↓
        </button>
      </div>

      {downloadError && <p className="text-sm text-[#EF4444]">{downloadError}</p>}

      <RedTeamRunCard run={run} />

      <div className="flex flex-col gap-3">
        <h2 className="text-[#FAFAFA] font-semibold text-sm">Agent Trace</h2>
        <AgentTraceViewer
          agentTrace={run.agentTrace ?? []}
          nodeConfig={RED_TEAM_NODES}
          isRunning={run.status === "running"}
        />
      </div>

      {run.status === "completed" && (
        <div className="flex flex-col gap-3">
          <h2 className="text-[#FAFAFA] font-semibold text-sm">Security Findings</h2>
          <FindingsTable findings={findings} reportSummary={run.reportSummary} />
        </div>
      )}

      {run.status === "running" && (
        <div className="flex flex-col items-center gap-3 py-12 border border-[#27272A] rounded-lg">
          <div className="flex items-center gap-2 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium">Red team agent running...</span>
          </div>
          <p className="text-xs text-[#71717A] text-center max-w-xs">
            Generating adversarial attacks, executing them, and analyzing results. This
            takes several minutes due to throttled LLM calls.
          </p>
        </div>
      )}
    </div>
  );
}
