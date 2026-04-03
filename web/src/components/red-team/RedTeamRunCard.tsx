"use client";

import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import type { RedTeamRun } from "@/types";

interface RedTeamRunCardProps {
  run: RedTeamRun;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "running") {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-950/40 text-amber-400 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Running
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-green-950/40 text-green-400 border border-green-500/30">
        <CheckCircle2 size={11} />
        Completed
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-red-950/40 text-red-400 border border-red-500/30">
      Error
    </span>
  );
}

export function RedTeamRunCard({ run }: RedTeamRunCardProps) {
  return (
    <div className="flex flex-col gap-4 p-6 bg-[#111113] border border-[#27272A] rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-950/30 border border-red-500/20">
            <Shield size={16} className="text-red-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#FAFAFA] font-semibold text-sm">Red Team Analysis</span>
            <span className="text-xs text-[#71717A]">{run.suite?.name ?? "Unknown Suite"}</span>
          </div>
        </div>
        <StatusBadge status={run.status} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#71717A]">Model</span>
          <span className="font-mono text-xs text-[#FAFAFA] truncate">{run.modelId}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#71717A]">Attacks Generated</span>
          <span className="font-mono text-sm text-[#FAFAFA]">{run.attacksGenerated}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#71717A]">Succeeded</span>
          <span
            className={`font-mono text-sm ${
              run.attacksSucceeded > 0 ? "text-red-400" : "text-green-400"
            }`}
          >
            {run.attacksSucceeded}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#71717A]">Critical</span>
          {run.criticalFindings > 0 ? (
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-red-400" />
              <span className="font-mono text-sm text-red-400">{run.criticalFindings}</span>
            </div>
          ) : (
            <span className="font-mono text-sm text-green-400">0</span>
          )}
        </div>
      </div>
    </div>
  );
}
