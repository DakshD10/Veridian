"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { TestCaseResult } from "@/hooks/useRun";
import { ScoreBreakdown } from "./ScoreBreakdown";

export function TestCaseAccordion({ testCase, index, defaultExpanded = false }: { testCase: TestCaseResult; index: number; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const numStr = String(index + 1).padStart(2, '0');

  const getBadgeColors = (status: string) => {
    switch (status) {
      case "CRITICAL FAIL": return "bg-[rgba(239,68,68,0.15)] text-[#EF4444]";
      case "FAIL": return "bg-[rgba(239,68,68,0.1)] text-[#EF4444]";
      case "WARN": return "bg-[rgba(245,158,11,0.1)] text-[#F59E0B]";
      case "PASS": return "bg-[rgba(34,197,94,0.1)] text-[#22C55E]";
      case "OPTIMAL": return "bg-[rgba(34,197,94,0.15)] text-[#22C55E]";
      default: return "";
    }
  };

  const statusBorderLineColor = (status: string) => {
    if (status.includes("FAIL")) return "border-[#EF4444]";
    if (status.includes("WARN")) return "border-[#F59E0B]";
    return "border-[#22C55E]";
  };

  const getScoreTint = (score: number) => {
    if (score >= 0.75) return "bg-[rgba(34,197,94,0.12)] text-[#22C55E]";
    if (score >= 0.50) return "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]";
    return "bg-[rgba(239,68,68,0.12)] text-[#EF4444]";
  };

  return (
    <div className="flex flex-col w-full">
      {/* HEADER / COLLAPSED STATE */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="py-4 border-b border-[#1F1F23] flex items-center gap-4 cursor-pointer hover:bg-[#111113] rounded-lg px-4 -mx-4 transition-colors"
      >
        <ChevronRight className={`w-4 h-4 text-[#52525B] transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`} />
        <span className="font-mono text-[12px] text-[#52525B] w-8">{numStr}</span>
        <span className="font-sans font-normal text-[14px] text-[#FAFAFA] truncate flex-1 max-w-[55%]">
          {testCase.input}
        </span>
        
        <div className="flex-1"></div>

        <div className={`rounded px-2.5 py-1 font-mono font-bold text-[13px] ${getScoreTint(testCase.overallScore)}`}>
          {testCase.overallScore.toFixed(2)}
        </div>
        
        <div className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold w-[100px] text-center ${getBadgeColors(testCase.status)}`}>
          {testCase.status}
        </div>
        
        <div className="font-mono text-[12px] text-[#52525B] w-16 text-right">
          {testCase.latencyMs}ms
        </div>
      </div>

      {/* EXPANDED STATE */}
      {isExpanded && (
        <div className={`bg-[#111113] rounded-lg p-6 mb-2 mt-2 border-l-[3px] ${statusBorderLineColor(testCase.status)}`}>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <span className="font-sans font-medium text-[11px] text-[#52525B] uppercase tracking-widest mb-2">INPUT</span>
              <div className="bg-[#18181B] rounded-lg p-4 font-sans font-normal text-[14px] text-[#FAFAFA] leading-relaxed">
                {testCase.input}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-medium text-[11px] text-[#52525B] uppercase tracking-widest mb-2">MODEL OUTPUT</span>
              <div className="bg-[#18181B] rounded-lg p-4 font-sans font-normal text-[14px] text-[#A1A1AA] leading-relaxed">
                {testCase.output}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <span className="font-sans font-medium text-[11px] text-[#52525B] uppercase tracking-widest mb-4 block">EVALUATION METRICS</span>
            <ScoreBreakdown metrics={testCase.metrics} />
          </div>
        </div>
      )}
    </div>
  );
}
