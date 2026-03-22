"use client";

import { useState } from "react";
import { Bot, Clock, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { ThresholdGauge } from "./ThresholdGauge";
import { SimulateModal } from "./SimulateModal";
import { useRouter } from "next/navigation";
import type { WatchedDeployment } from "@/types";

type DeploymentCardData = WatchedDeployment & {
  suite?: {
    name?: string;
  } | null;
  agentRuns?: Array<{
    id: string;
    status?: string;
    triggerEvent?: string;
    createdAt?: string;
    regressionFound?: boolean;
    newScore?: number | null;
  }>;
};

export function DeploymentCard({ deployment, isDetail = false }: { deployment: DeploymentCardData; isDetail?: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const latestAgentRun = deployment.agentRuns?.[0];
  const qualityScore = latestAgentRun?.newScore ?? 0;
  const isActive = deployment.isActive;
  const statusLabel = isActive ? "WATCHING" : "PAUSED";
  const statusTint = isActive ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#71717A]/10 text-[#A1A1AA]";
  const lastTriggeredText = latestAgentRun?.createdAt
    ? new Date(latestAgentRun.createdAt).toLocaleString()
    : "Never";
  const regressions = deployment.agentRuns?.filter((run) => run.regressionFound).length ?? 0;
  const suiteName = deployment.suite?.name ?? deployment.suiteId;

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case "OPTIMAL": return "bg-[#22C55E]/5 text-[#22C55E] border border-[#22C55E]/20";
      case "STABLE": return "bg-[#22C55E]/5 text-[#22C55E] border border-[#22C55E]/20";
      case "CAPTURED": return "bg-[#8B5CF6]/5 text-[#A78BFA] border border-[#8B5CF6]/20";
      default: return "bg-zinc-800/10 text-zinc-400 border border-zinc-700/50";
    }
  };

  const handleClick = () => {
    if (!isDetail) {
      router.push(`/deployments/${deployment.id}`);
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        className={`bg-[#111113] border border-[#1F1F23] rounded-xl p-6 border-l-[3px] border-l-[#22C55E] group ${!isDetail ? 'cursor-pointer hover:bg-[#151518]' : ''} transition-all duration-300 w-full`}
      >
         <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${statusTint}`}>
                     <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#22C55E] animate-pulse" : "bg-[#A1A1AA]"}`}></div>
                     <span className="text-[11px] font-bold tracking-widest uppercase">{statusLabel}</span>
                  </div>
                  <span className="text-[13px] font-mono text-[#71717A]">{deployment.currentModel}</span>
               </div>
               <h2 className="text-[18px] font-semibold text-[#FAFAFA] tracking-tight font-sans">{deployment.name}</h2>
               <p className="text-[13px] text-[#71717A] font-sans">Suite: {suiteName}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
              className="px-4 py-2 border border-[#EF4444]/60 bg-[#EF4444]/5 hover:bg-[#EF4444]/10 text-[#EF4444] text-[13px] font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer z-10"
            >
              <ArrowLeftRight className="w-[18px] h-[18px]" strokeWidth={2} />
              Simulate Version Change
            </button>
         </div>

         {/* Metrics & Gauges Grid */}
         <div className="grid grid-cols-12 gap-8 items-center mt-2">
            {/* Gauge Section */}
            <div className="col-span-7 space-y-2">
               <div className="flex justify-between items-end">
                  <span className="text-[12px] font-semibold text-[#A1A1AA] uppercase tracking-wider font-sans">Quality Score</span>
                  <div className="text-right">
                     <span className="block text-[10px] text-[#71717A] uppercase font-sans tracking-wide">Current Performance</span>
                     <span className="text-[14px] font-mono font-bold text-[#22C55E]">{qualityScore.toFixed(2)}</span>
                  </div>
               </div>
               <ThresholdGauge score={qualityScore} threshold={deployment.threshold} />
            </div>

            {/* Vertical Gutter */}
            <div className="col-span-1 flex justify-center h-12 border-l border-[#27272A]/50 self-center"></div>

            {/* Stats Section */}
            <div className="col-span-4 flex flex-col justify-center space-y-3">
               <div className="flex items-center gap-2 text-[12px] font-mono text-[#52525B]">
                  <Bot className="w-[18px] h-[18px]" />
                  {deployment.agentRuns?.length ?? 0} agent runs
               </div>
               <div className="flex items-center gap-2 text-[12px] font-mono text-[#52525B]">
                  <Clock className="w-[18px] h-[18px]" />
                  Last triggered {lastTriggeredText}
               </div>
               <div className="flex items-center gap-2 text-[12px] font-mono text-[#52525B]">
                  <CheckCircle2 className="w-[18px] h-[18px]" />
                  {regressions} regressions
               </div>
            </div>
         </div>

         {/* Mini Feed (Subtle) */}
         <div className="mt-10 pt-6 border-t border-[#1F1F23] space-y-3 flex flex-col">
            <h3 className="text-[11px] font-bold text-[#52525B] uppercase tracking-widest mb-2 font-sans">Event Stream</h3>
            <div className="flex flex-col w-full">
              {(deployment.agentRuns?.length ?? 0) > 0 ? (
                deployment.agentRuns?.map((run) => {
                  const badge = run.regressionFound ? "CAPTURED" : "STABLE";
                  return (
                    <div key={run.id} className="flex items-center justify-between py-1.5 hover:bg-[#18181B] px-3 -mx-3 rounded transition-colors w-full">
                      <div className="flex items-center gap-5">
                        <span className="text-[11px] font-mono text-[#52525B]">
                          {run.createdAt ? new Date(run.createdAt).toLocaleTimeString() : "—"}
                        </span>
                        <span className="text-[12px] text-[#A1A1AA] font-sans">{run.triggerEvent ?? "Agent run completed"}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${getBadgeStyle(badge)}`}>
                        {badge}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-2 text-[12px] text-[#71717A] font-sans">No agent activity yet.</div>
              )}
            </div>
         </div>
      </div>

      <SimulateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
