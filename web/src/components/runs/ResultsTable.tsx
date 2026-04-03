"use client";

import { useState } from "react";
import { ScoreBreakdown } from "@/components/runs/ScoreBreakdown";
import { RunStatusBadge } from "@/components/runs/RunStatusBadge";

interface TestResult {
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
    input: string;
    expectedOutput: string;
  };
}

interface ResultsTableProps {
  results: TestResult[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-sm text-muted-foreground">No results yet</p>
      </div>
    );
  }

  return (
    <div className="w-full border border-[#1F1F23] rounded-lg overflow-hidden bg-[#121215]">
      <div className="grid grid-cols-[2fr_120px_120px_120px] gap-4 px-4 py-3 border-b border-[#1F1F23] bg-[#0A0A0D]">
        <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">Input</p>
        <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">Score</p>
        <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">Status</p>
        <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">Latency</p>
      </div>

      {results.map((result) => {
        const isExpanded = expandedRowId === result.id;

        return (
          <div key={result.id} className="border-b border-[#1F1F23] last:border-b-0">
            <button
              type="button"
              onClick={() => setExpandedRowId(isExpanded ? null : result.id)}
              className="w-full grid grid-cols-[2fr_120px_120px_120px] gap-4 px-4 py-3 text-left hover:bg-[#18181B] transition-colors"
            >
              <p className="text-sm text-[#FAFAFA] truncate">{result.testCase.input}</p>
              <p className="font-mono text-sm text-[#A1A1AA]">{result.overallScore.toFixed(2)}</p>
              <RunStatusBadge status={result.passed ? "COMPLETED" : "FAILED"} />
              <p className="font-mono text-sm text-[#A1A1AA]">
                {result.latencyMs === null ? "--" : `${result.latencyMs}ms`}
              </p>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 bg-[#0E0E10]">
                <p className="text-xs text-[#71717A] mb-2">Expected: {result.testCase.expectedOutput}</p>
                <p className="text-xs text-[#71717A] mb-3">Output: {result.modelOutput}</p>
                <ScoreBreakdown
                  metrics={result.metricScores.map((metric) => ({
                    name: metric.metricName,
                    score: metric.score,
                    reason: metric.reason ?? "No reason provided.",
                  }))}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
