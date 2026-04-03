"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { VulnerabilityBadge } from "./VulnerabilityBadge";
import type { RedTeamVulnerability } from "@/types";

interface FindingsTableProps {
  findings: RedTeamVulnerability[];
  reportSummary: string | null;
}

export function FindingsTable({ findings, reportSummary }: FindingsTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");

  if (findings.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-4 bg-green-950/20 border border-green-500/25 rounded-lg">
          <ShieldCheck size={18} className="text-green-400 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-green-400 font-medium text-sm">
              No Vulnerabilities Detected
            </span>
            <span className="text-xs text-[#71717A]">
              Model withstood all adversarial inputs. No exploitable weaknesses found.
            </span>
          </div>
        </div>

        {reportSummary && (
          <div className="p-4 bg-[#111113] border border-[#27272A] rounded-lg">
            <p className="text-xs uppercase tracking-wide text-[#71717A] mb-2">
              Report Summary
            </p>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">{reportSummary}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasCritical && (
        <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
          <ShieldAlert size={18} className="text-red-400 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-red-400 font-semibold text-sm">
              ⚠ CRITICAL VULNERABILITIES FOUND
            </span>
            <span className="text-xs text-[#A1A1AA]">
              This model has critical security issues. Do NOT deploy to production before
              addressing these findings.
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6">
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => {
          const count = findings.filter((f) => f.severity === sev).length;
          if (count === 0) return null;
          return (
            <div key={sev} className="flex items-center gap-2">
              <VulnerabilityBadge severity={sev} size="sm" />
              <span className="font-mono text-sm text-[#FAFAFA]">{count}</span>
            </div>
          );
        })}
        <span className="text-xs text-[#71717A]">
          {findings.length} total finding{findings.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="border border-[#27272A] rounded-lg overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto] gap-px bg-[#27272A] text-xs uppercase tracking-wide text-[#71717A]">
          <div className="bg-[#111113] px-3 py-2 w-32">Severity</div>
          <div className="bg-[#111113] px-3 py-2">Description</div>
          <div className="bg-[#111113] px-3 py-2 w-32">Attack Type</div>
        </div>

        {findings.map((finding, index) => (
          <div key={index}>
            <button
              type="button"
              onClick={() => setExpandedRow(expandedRow === index ? null : index)}
              className="w-full grid grid-cols-[auto_1fr_auto] gap-px bg-[#27272A] text-left hover:bg-[#27272A]/80 transition-colors"
            >
              <div className="bg-[#111113] px-3 py-3 w-32 flex items-center">
                <VulnerabilityBadge severity={finding.severity} size="sm" />
              </div>
              <div className="bg-[#111113] px-3 py-3 flex items-start gap-2">
                <span className="text-sm text-[#A1A1AA] leading-relaxed text-left">
                  {finding.description}
                </span>
              </div>
              <div className="bg-[#111113] px-3 py-3 w-32 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-[#52525B] truncate">
                  {finding.attack_type}
                </span>
                {(finding.input || finding.output) &&
                  (expandedRow === index ? (
                    <ChevronDown size={12} className="text-[#52525B] shrink-0" />
                  ) : (
                    <ChevronRight size={12} className="text-[#52525B] shrink-0" />
                  ))}
              </div>
            </button>

            {expandedRow === index && (finding.input || finding.output) && (
              <div className="bg-[#0D0D0F] border-t border-[#27272A] px-4 py-4 grid grid-cols-2 gap-4">
                {finding.input && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs uppercase tracking-wide text-[#71717A]">Attack Input</p>
                    <div className="bg-[#111113] border border-[#27272A] rounded-md p-3 text-xs text-[#A1A1AA] leading-relaxed font-mono max-h-36 overflow-y-auto">
                      {finding.input}
                    </div>
                  </div>
                )}
                {finding.output && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs uppercase tracking-wide text-[#71717A]">Model Output</p>
                    <div className="bg-[#111113] border border-[#27272A] rounded-md p-3 text-xs text-[#A1A1AA] leading-relaxed max-h-36 overflow-y-auto">
                      {finding.output}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {reportSummary && (
        <div className="flex flex-col gap-2 p-4 bg-[#111113] border border-[#27272A] rounded-lg">
          <p className="text-xs uppercase tracking-wide text-[#71717A]">Report Summary</p>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">{reportSummary}</p>
        </div>
      )}
    </div>
  );
}
