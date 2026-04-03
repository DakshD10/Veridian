"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BookOpen,
  FileText,
  GitCompare,
  Play,
  Search,
  Sigma,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Add CSS for traveling dot animation
const travelDownCSS = `
@keyframes travelDown {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(28px); opacity: 0; }
}`;

const NODE_CONFIGS: Array<{
  name: string;
  icon: LucideIcon;
  displayLabel: string;
}> = [
  { name: "trigger_received", icon: Zap, displayLabel: "trigger_received" },
  { name: "load_eval_suite", icon: BookOpen, displayLabel: "load_eval_suite" },
  { name: "run_model", icon: Play, displayLabel: "run_model" },
  { name: "score_results", icon: Sigma, displayLabel: "score_results" },
  { name: "compare_baseline", icon: GitCompare, displayLabel: "compare_baseline" },
  { name: "root_cause_analysis", icon: Search, displayLabel: "root_cause_analysis" },
  { name: "generate_report", icon: FileText, displayLabel: "generate_report" },
  { name: "notify", icon: Bell, displayLabel: "notify" },
];

const NODE_ICON_MAP: Record<string, LucideIcon> = {
  trigger_received: Zap,
  load_eval_suite: BookOpen,
  run_model: Play,
  score_results: Sigma,
  compare_baseline: GitCompare,
  root_cause_analysis: Search,
  generate_report: FileText,
  notify: Bell,
  load_targets: BookOpen,
  generate_attacks: Play,
  execute_attacks: Zap,
  analyze_vulnerabilities: Search,
  generate_red_team_report: FileText,
};

if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = travelDownCSS;
  document.head.appendChild(style);
}

interface AgentTraceStep {
  node: string;
  timestamp: string;
  summary: string;
  status: string;
  reportSummary?: string | null;
}

function formatTime(timestamp: string): string {
  const ms = Date.parse(timestamp);
  if (!Number.isFinite(ms)) return "--:--:-- UTC";
  const date = new Date(ms);
  return date.toISOString().split("T")[1].split(".")[0] + " UTC";
}

function getElapsedTime(current: string, previous?: string): string {
  if (!previous) return "0ms";
  const currentMs = Date.parse(current);
  const previousMs = Date.parse(previous);
  if (!Number.isFinite(currentMs) || !Number.isFinite(previousMs)) return "--";
  const diff = currentMs - previousMs;
  if (diff < 0) return "--";
  if (diff < 1000) return `${diff}ms`;
  return `${(diff / 1000).toFixed(1)}s`;
}

function getStateColor(status: string): string {
  switch (status) {
    case "done": return "#22C55E";
    case "running": return "#8B5CF6";
    case "pending": return "#27272A";
    case "error": return "#EF4444";
    default: return "#27272A";
  }
}

function NodeCard({ 
  node,
  icon: Icon,
  displayLabel,
  step, 
  stepNumber, 
  previousTimestamp,
  showConnector,
  connectorColor,
  rootCause,
  reportSummary
}: {
  node: string;
  icon: LucideIcon;
  displayLabel: string;
  step?: AgentTraceStep;
  stepNumber: number;
  previousTimestamp?: string;
  showConnector: boolean;
  connectorColor?: string;
  rootCause?: string | null;
  reportSummary?: string | null;
}) {
  const status = step?.status || "pending";
  const stateColor = getStateColor(status);
  const isDone = status === "done";

  // Enhanced summary parsing for regression detection
  let enhancedSummary = step?.summary || "Pending";
  let regressionInfo = null;
  
  if (node === "compare_baseline" && step?.summary?.includes("REGRESSION DETECTED")) {
    enhancedSummary = step.summary.replace(
      /(\d+\.\d+)\s*→\s*(\d+\.\d+)/g,
      '<span class="font-mono text-[#FAFAFA]">$1 → $2</span>'
    );
    
    // Extract score comparison for special display
    const scoreMatch = step.summary.match(/(\d+\.\d+)\s*→\s*(\d+\.\d+)/);
    if (scoreMatch) {
      regressionInfo = {
        prev: scoreMatch[1],
        new: scoreMatch[2]
      };
    }
  }

  return (
    <motion.div
      id={`node-${node}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative mb-0"
    >
      {/* Node Card */}
      <div 
        className="bg-[#0C0C0F] border border-[#1A1A1E] rounded-xl overflow-hidden hover:border-opacity-50 transition-all duration-200"
        style={{ 
          borderLeft: "3px solid",
          borderLeftColor: stateColor
        }}
      >
        {/* CARD HEADER */}
        <div className="bg-[#0E0E12] border-b border-[#1A1A1E] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-[10px] font-mono text-[#3F3F46] mr-3">
              {String(stepNumber).padStart(2, "0")}
            </div>
            <div className="w-7 h-7 rounded-full relative mr-2.5">
              <div
                className="w-full h-full rounded-full border-2"
                style={{
                  backgroundColor: stateColor,
                  borderColor: stateColor + "40"
                }}
              >
                {status === "done" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
                {status === "running" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-spin" />
                  </div>
                )}
                {status === "error" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
                {status === "pending" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#52525B] rounded-full" />
                  </div>
                )}
                {(status === "done" || status === "pending") && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={11} className="text-white/90" />
                  </div>
                )}
              </div>
            </div>
            <div className="font-mono font-bold text-[13px] text-[#FAFAFA]">
              {displayLabel}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-[10px] text-[#3F3F46]">
              {step ? formatTime(step.timestamp) : "--:--:-- UTC"}
            </div>
            {step && previousTimestamp && (
              <div className="font-mono text-[10px] bg-[#141418] border border-[#1E1E24] rounded px-2 py-0.5 text-[#52525B]">
                {getElapsedTime(step.timestamp, previousTimestamp)}
              </div>
            )}
          </div>
        </div>

        {/* CARD BODY */}
        <div className={`px-4 py-3 ${
          node === "compare_baseline" && regressionInfo ? "bg-red-950/4" : ""
        }`}>
          <div 
            className="text-[12px] text-[#71717A] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: enhancedSummary }}
          />
          
          {/* Special regression info */}
          {regressionInfo && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-red-900/20">
              <div className="text-[10px] font-mono font-bold text-red-400">
                REGRESSION DETECTED
              </div>
              <div className="font-mono text-[12px]">
                <span className="text-[#A1A1AA]">{regressionInfo.prev}</span>
                <span className="text-red-400 font-bold ml-1">→</span>
                <span className="text-red-400 font-bold ml-1">{regressionInfo.new}</span>
              </div>
            </div>
          )}

          {/* Generate Report Expansion */}
          {node === "generate_report" && isDone && (step?.reportSummary || reportSummary) && (
            <div className="mt-3">
              <div className="bg-[#0A0A0E] border border-[rgba(139,92,246,0.12)] rounded-lg p-3">
                <div className="text-[9px] font-mono text-violet-500/50 uppercase tracking-widest mb-2">
                  AI Generated Report
                </div>
                <div className="italic text-[12px] text-[#A1A1AA] leading-relaxed">
                  {step?.reportSummary ?? reportSummary}
                </div>
              </div>
            </div>
          )}

          {/* Root Cause Expansion */}
          {node === "root_cause_analysis" && isDone && rootCause && (
            <div className="mt-2 italic text-[#71717A] text-xs leading-relaxed">
              {rootCause.length > 120 ? `${rootCause.slice(0, 120)}...` : rootCause}
            </div>
          )}
        </div>
      </div>

      {/* CONNECTOR */}
      {showConnector && (
        <div className="relative h-7 flex items-center justify-center">
          <div 
            className="w-0.5 h-full"
            style={{ backgroundColor: connectorColor }}
          />
          {/* Traveling dot for active connectors */}
          {connectorColor === "#8B5CF6" && (
            <div 
              className="absolute w-1 h-1 bg-violet-400 rounded-full"
              style={{
                animation: "travelDown 1s linear infinite"
              }}
            />
          )}
          {/* Elapsed time label */}
          {step && previousTimestamp && (
            <div className="absolute left-2 text-[8px] font-mono text-[#27272A]">
              {getElapsedTime(step.timestamp, previousTimestamp)}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function AgentTraceViewer({
  agentTrace = [],
  rootCause,
  reportSummary,
  nodeConfig,
  isRunning,
}: {
  agentTrace?: AgentTraceStep[];
  rootCause?: string | null;
  reportSummary?: string | null;
  nodeConfig?: Array<{ name: string; label: string }>;
  isRunning?: boolean;
}) {
  const effectiveNodes =
    nodeConfig?.map((node) => ({
      name: node.name,
      displayLabel: node.label,
      icon: NODE_ICON_MAP[node.name] ?? Play,
    })) ?? NODE_CONFIGS;

  const nodeOrder = effectiveNodes.map((node) => node.name);
  const nodeNameSet = new Set(nodeOrder);

  const traceMap = new Map(
    agentTrace
      .filter((step) => nodeNameSet.has(step.node))
      .map((step) => [step.node, step])
  );

  if (isRunning && agentTrace.length > 0) {
    const latest = agentTrace[agentTrace.length - 1];
    if (latest && nodeNameSet.has(latest.node)) {
      traceMap.set(latest.node, latest);
    }
  }

  return (
    <AnimatePresence mode="popLayout">
      <div className="flex flex-col w-full">
        {nodeOrder.map((nodeName, index) => {
          const config = effectiveNodes[index];
          const traceData = traceMap.get(nodeName);
          const previousTimestamp = index > 0 ? traceMap.get(nodeOrder[index - 1])?.timestamp : undefined;
          
          const showConnector = index < nodeOrder.length - 1;
          const nextNode = nodeOrder[index + 1];
          const nextTraceData = nextNode ? traceMap.get(nextNode) : undefined;
          
          // Connector color logic
          let connectorColor = "#27272A";
          
          if (traceData?.status === "done" && nextTraceData?.status === "done") {
            connectorColor = "#22C55E";
          } else if (traceData?.status === "done" && nextTraceData?.status === "running") {
            connectorColor = "#8B5CF6";
          }

          return (
            <NodeCard
              key={nodeName}
              node={nodeName}
              icon={config.icon}
              displayLabel={config.displayLabel}
              step={traceData}
              stepNumber={index + 1}
              previousTimestamp={previousTimestamp}
              showConnector={showConnector}
              connectorColor={connectorColor}
              rootCause={rootCause}
              reportSummary={reportSummary}
            />
          );
        })}
      </div>
    </AnimatePresence>
  );
}
