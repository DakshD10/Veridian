"use client";

import { motion } from "framer-motion";

interface AgentMetricsPanelProps {
  agentRun?: {
    id: string;
    triggerEvent: string;
    previousScore: number | null;
    newScore: number | null;
    regressionFound: boolean;
    decision: string | null;
    createdAt: string;
    deployment?: {
      name: string;
      suite?: {
        name: string;
      };
    };
  };
  agentTrace?: Array<{
    node: string;
    timestamp: string;
    summary: string;
    status: "done" | "pending" | "running" | "error";
  }>;
  deploymentThreshold?: number;
}

export function AgentMetricsPanel({ agentRun, agentTrace, deploymentThreshold }: AgentMetricsPanelProps) {
  // Calculate node timings
  const nodeTimings = agentTrace?.map((node, index) => {
    const prevTimestamp = index > 0 ? agentTrace[index - 1].timestamp : node.timestamp;
    const duration = new Date(node.timestamp).getTime() - new Date(prevTimestamp).getTime();
    return {
      name: node.node.replace(/_/g, " "),
      shortName: node.node.replace(/_/g, "").substring(0, 6),
      duration: duration / 1000, // Convert to seconds
      status: node.status
    };
  }) || [];

  // Calculate pass/fail ratio from real scored results
  const scoredResults = agentTrace
    ?.filter(step => step.status === "done")
    ?.map(step => {
      // Extract score from summary if available
      const scoreMatch = step.summary.match(/score[:\s]*(\d+\.?\d*)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
      return {
        name: step.node.replace(/_/g, " "),
        score: score,
        threshold: deploymentThreshold || 0.75
      };
    })
    .filter(result => result.score !== null) || [];

  // Calculate real pass/fail ratio
  const totalTests = scoredResults.length;
  const passedTests = scoredResults.filter(r => r.score && r.threshold && r.score >= r.threshold).length;
  const failedTests = totalTests - passedTests;

  return (
    <div className="space-y-4">
      {/* METRICS CARD 1 — SCORE BREAKDOWN */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="bg-[#0C0C0F] border border-[#1A1A1E] rounded-xl overflow-hidden"
      >
        <div className="bg-[#0E0E12] border-b border-[#1A1A1E] px-4 py-2.5">
          <div className="text-[11px] font-mono text-[#52525B]">Score Breakdown</div>
        </div>
        <div className="px-4 py-3 space-y-3">
          {scoredResults.length > 0 ? scoredResults.map((result, index) => (
            <div key={result.name} className="flex items-center gap-3">
              <div className="text-[11px] font-mono text-[#71717A] capitalize w-20">
                {result.name}
              </div>
              <div className="flex-1 h-1 rounded-full bg-[#1A1A1E] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: (result.score || 0) >= (result.threshold || 0) ? "#22C55E" : "#EF4444"
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(result.score || 0) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 + index * 0.1 }}
                />
              </div>
              <div className={`text-[11px] font-mono font-bold w-12 text-right ${
                (result.score || 0) >= (result.threshold || 0) ? "text-green-500" : "text-red-400"
              }`}>
                {(result.score || 0).toFixed(2)}
              </div>
            </div>
          )) : (
            <div className="text-[11px] font-mono text-[#52525B] text-center py-4">
              No scored results available
            </div>
          )}
        </div>
      </motion.div>

      {/* METRICS CARD 2 — PASS / FAIL RATIO */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.16 }}
        className="bg-[#0C0C0F] border border-[#1A1A1E] rounded-xl overflow-hidden"
      >
        <div className="bg-[#0E0E12] border-b border-[#1A1A1E] px-4 py-2.5">
          <div className="text-[11px] font-mono text-[#52525B]">Test Results</div>
        </div>
        <div className="px-4 py-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-4 border-green-500/20 flex items-center justify-center">
                <div className="text-green-500 font-mono font-bold text-[20px]">
                  {passedTests}
                </div>
              </div>
              <div className="text-[10px] font-mono text-[#52525B] mt-2">Passed</div>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-4 border-red-500/20 flex items-center justify-center">
                <div className="text-red-400 font-mono font-bold text-[20px]">
                  {failedTests}
                </div>
              </div>
              <div className="text-[10px] font-mono text-[#52525B] mt-2">Failed</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* METRICS CARD 3 — TIMELINE */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.24 }}
        className="bg-[#0C0C0F] border border-[#1A1A1E] rounded-xl overflow-hidden"
      >
        <div className="bg-[#0E0E12] border-b border-[#1A1A1E] px-4 py-2.5">
          <div className="text-[11px] font-mono text-[#52525B]">Node Timing</div>
        </div>
        <div className="px-4 py-3 space-y-2">
          {nodeTimings.map((timing, index) => (
            <div key={timing.name} className="flex items-center gap-3">
              <div className="text-[9px] font-mono text-[#52525B] w-14 truncate">
                {timing.shortName}
              </div>
              <div className="flex-1 h-1 rounded-full bg-[#1A1A1E] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: 
                      timing.status === "done" ? "#22C55E" :
                      timing.status === "running" ? "#8B5CF6" :
                      timing.status === "error" ? "#EF4444" : "#27272A"
                  }}
                  initial={{ width: 0 }}
                  animate={{ 
                    width: timing.status === "done" ? `${Math.min((timing.duration / 10) * 100, 100)}%` : "0%"
                  }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 + index * 0.1 }}
                />
              </div>
              <div className="text-[9px] font-mono text-[#52525B] w-12 text-right">
                {timing.status === "done" ? `${timing.duration.toFixed(1)}s` : "--"}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* METRICS CARD 4 — DEPLOYMENT INFO */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.32 }}
        className="bg-[#0C0C0F] border border-[#1A1A1E] rounded-xl overflow-hidden"
      >
        <div className="bg-[#0E0E12] border-b border-[#1A1A1E] px-4 py-2.5">
          <div className="text-[11px] font-mono text-[#52525B]">Deployment</div>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between">
            <div className="text-[10px] font-mono text-[#52525B]">Model</div>
            <div className="text-[11px] font-mono text-[#A1A1AA] truncate ml-2">
              {agentRun?.triggerEvent || "Unknown"}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="text-[10px] font-mono text-[#52525B]">Suite</div>
            <div className="text-[11px] font-mono text-[#A1A1AA] truncate ml-2">
              {agentRun?.deployment?.name || "Default"}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="text-[10px] font-mono text-[#52525B]">Trigger</div>
            <div className="text-[11px] font-mono text-[#A1A1AA] truncate ml-2">
              {agentRun?.triggerEvent || "Manual"}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="text-[10px] font-mono text-[#52525B]">Run ID</div>
            <div className="text-[11px] font-mono text-[#A1A1AA] truncate ml-2">
              {agentRun?.id?.substring(0, 8) || "Unknown"}
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-[#1A1A1E]">
            <a 
              href={`/deployments`} 
              className="text-[10px] font-mono text-violet-400 hover:text-violet-300 transition inline-block"
            >
              View Deployment →
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
