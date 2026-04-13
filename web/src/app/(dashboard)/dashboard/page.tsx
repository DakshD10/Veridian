"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { StatCard } from "@/components/dashboard/StatCard";
import { QualityTrendChart } from "@/components/dashboard/QualityTrendChart";
import { ModelComparisonChart } from "@/components/dashboard/ModelComparisonChart";
import { EvalPipelineCanvas } from "@/components/dashboard/EvalPipelineCanvas";
import { AmbientGrid } from "@/components/dashboard/AmbientGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef } from "react";
import {
  useDashboardStats,
  useQualityTrend,
  useModelComparison,
} from "@/hooks/useDashboard";
import { useSuites } from "@/hooks/useSuites";
import { useRuns } from "@/hooks/useRuns";
import { RunStatusBadge } from "@/components/runs/RunStatusBadge";

interface SuiteListItem {
  id: string;
  name: string;
  domain: string | null;
  _count?: {
    testCases: number;
    runs: number;
  };
}

interface TrendPoint {
  date: string;
  score: number;
  modelId: string;
}

interface ModelPoint {
  modelId: string;
  avgScore: number;
  runCount: number;
}

interface RecentRun {
  id: string;
  modelId: string;
  status: string;
  overallScore?: number;
  createdAt: string;
}

interface AgentRun {
  id: string;
  previousScore: number | null;
  newScore: number | null;
  regressionFound: boolean;
  createdAt: string;
  deployment: {
    id: string;
    name: string;
  };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

function LoadingState() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0D] w-full p-8 gap-6">
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-[140px] rounded-lg bg-[#121215]" />
        <Skeleton className="h-[140px] rounded-lg bg-[#121215]" />
        <Skeleton className="h-[140px] rounded-lg bg-[#121215]" />
        <Skeleton className="h-[140px] rounded-lg bg-[#121215]" />
      </div>
      <div className="flex gap-6 w-full mt-2">
        <Skeleton className="w-[62%] h-[350px] rounded-lg bg-[#121215]" />
        <Skeleton className="w-[38%] h-[350px] rounded-lg bg-[#121215]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const {
    data: suites = [],
    isLoading: suitesLoading,
    isError: suitesError,
  } = useSuites();

  const suiteList = suites as SuiteListItem[];
  const selectedSuiteId = suiteList
    .slice()
    .sort((a, b) => (b._count?.runs ?? 0) - (a._count?.runs ?? 0))[0]?.id;

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useDashboardStats();

  const {
    data: rawTrend = [],
    isLoading: trendLoading,
    isError: trendError,
  } = useQualityTrend(selectedSuiteId);

  const {
    data: rawComparison = [],
    isLoading: comparisonLoading,
    isError: comparisonError,
  } = useModelComparison(selectedSuiteId);

  const {
    data: recentRunsResponse,
    isLoading: recentRunsLoading,
  } = useRuns({ limit: 10 });
  
  const recentRuns = recentRunsResponse?.data || [];

  const {
    data: agentRuns = [],
  } = useQuery<AgentRun[]>({
    queryKey: ["agent-runs"],
    queryFn: () => api.get("/api/agent-runs"),
  });

  const regressions = (agentRuns ?? [])
    .filter((r: AgentRun) => r.regressionFound)
    .sort((a: AgentRun, b: AgentRun) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading =
    suitesLoading ||
    statsLoading ||
    trendLoading ||
    comparisonLoading ||
    recentRunsLoading;

  const isError =
    suitesError ||
    statsError ||
    trendError ||
    comparisonError;

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Check your connection and try refreshing.
        </p>
      </div>
    );
  }

  if (!suiteList || suiteList.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A0A0D] w-full p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-sans text-[20px] font-bold text-[#FAFAFA]">Dashboard</h1>
          <Link
            href="/suites/new"
            className="border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 text-[13px] font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Suite
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-[#1F1F23]">
          <p className="text-sm text-muted-foreground">No suites yet. Create your first eval suite.</p>
        </div>
      </div>
    );
  }

  const trendData = (rawTrend as TrendPoint[]).map((point) => ({
    run: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: point.score,
  }));

  const modelComparisonData = (rawComparison as ModelPoint[]).map((point) => ({
    modelId: point.modelId,
    score: point.avgScore,
    fill:
      point.avgScore >= 0.75
        ? "#22C55E"
        : point.avgScore >= 0.5
          ? "#F59E0B"
          : "#EF4444",
  }));

  const delta =
    trendData.length >= 2
      ? trendData[trendData.length - 1].score - trendData[0].score
      : null;

  const deltaText =
    delta === null
      ? undefined
      : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} vs period start`;

  const deltaColor = delta !== null && delta >= 0 ? "text-[#22C55E]" : "text-[#EF4444]";

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0D] w-full relative">
      {/* Background Effects */}
      <AmbientGrid />
      <EvalPipelineCanvas />

      <div className="flex justify-between items-center h-[56px] px-8 border-b border-[#1F1F23] relative z-10">
        <h1 className="font-sans text-[20px] font-bold text-[#FAFAFA]">Dashboard</h1>
        <Link
          href="/suites/new"
          className="border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 text-[13px] font-medium px-4 py-2 rounded-lg transition flex items-center gap-2 active:scale-[0.97] transition-transform duration-75"
        >
          <Plus className="w-4 h-4" />
          New Suite
        </Link>
      </div>

      <div className="p-8 flex flex-col gap-8 w-full relative z-10">
        <div className="grid grid-cols-4 gap-4">
          <Link href="/suites" className="block">
            <StatCard label="TOTAL SUITES" value={stats?.totalSuites ?? 0} index={0} />
          </Link>
          <Link href="/runs" className="block">
            <StatCard label="TOTAL RUNS" value={stats?.totalRuns ?? 0} index={1} />
          </Link>
          <Link href="/runs" className="block">
            <StatCard
              label="REGRESSIONS"
              value={stats?.regressionsCaught ?? 0}
              index={2}
            />
          </Link>
          <StatCard
            label="AVG QUALITY"
            value={stats?.avgScore?.toFixed(2) ?? "0.00"}
            deltaText={deltaText}
            deltaColor={deltaText ? deltaColor : undefined}
            index={3}
          />
        </div>

        <div className="grid grid-cols-[3fr_2fr] gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.99, y: 12 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1], delay: 0.1 }}
          >
            <QualityTrendChart data={trendData} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.99, y: 12 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1], delay: 0.15 }}
          >
            <ModelComparisonChart data={modelComparisonData} />
          </motion.div>
        </div>

        {/* FULL WIDTH SUITES OVERVIEW */}
        <div className="bg-[#0C0C0F] border border-[#1A1A1E] rounded-xl overflow-hidden mb-4 w-full">
          <div className="px-4 py-3 border-b border-[#1A1A1E] flex items-center justify-between">
            <motion.h3 
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-[11px] font-mono text-[#52525B] uppercase tracking-widest"
            >
              Suites Overview
            </motion.h3>
            <Link href="/suites" className="text-[11px] font-mono text-violet-400 hover:text-violet-300 transition relative group">
              View all suites 
              <span className="relative">
                →
                <span className="absolute bottom-0 left-0 h-px bg-violet-500 w-0 group-hover:w-full transition-all duration-200" />
              </span>
            </Link>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1A1A1E] bg-[#0E0E12]">
                <th className="text-[10px] font-mono text-[#3F3F46] uppercase tracking-widest px-4 py-2 border-b border-[#1A1A1E]">SUITE</th>
                <th className="text-[10px] font-mono text-[#3F3F46] uppercase tracking-widest px-4 py-2 border-b border-[#1A1A1E]">DOMAIN</th>
                <th className="text-[10px] font-mono text-[#3F3F46] uppercase tracking-widest px-4 py-2 border-b border-[#1A1A1E]">TEST CASES</th>
                <th className="text-[10px] font-mono text-[#3F3F46] uppercase tracking-widest px-4 py-2 border-b border-[#1A1A1E]">RUNS</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#FAFAFA]">
              {suiteList.map((suite, index) => (
                <motion.tr 
                  key={suite.id} 
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="px-4 py-3 border-b border-[#1A1A1E] last:border-b-0 hover:bg-[rgba(255,255,255,0.02)] transition cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link href={`/suites/${suite.id}`} className="text-[13px] text-[#FAFAFA] font-medium hover:text-[#8B5CF6]">
                      {suite.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-[#27272A] text-[#A1A1AA] text-[10px] font-mono px-2 py-1 rounded">
                      {suite.domain ?? "general"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#A1A1AA]">
                    {suite._count?.testCases ?? 0}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#A1A1AA]">
                    {suite._count?.runs ?? 0}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TWO COLUMN ROW - RECENT RUNS AND REGRESSIONS */}
        <div className="grid grid-cols-[3fr_2fr] gap-4">
          {/* RECENT RUNS PANEL */}
          <div className="bg-[#0C0C0F] border border-[#1A1A1E] rounded-xl overflow-hidden h-[340px] flex flex-col">
            <div className="px-4 py-3 border-b border-[#1A1A1E] flex items-center justify-between">
              <motion.h3 
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-[11px] font-mono text-[#52525B] uppercase tracking-widest"
              >
                Recent Runs
              </motion.h3>
              <Link href="/runs" className="text-[11px] font-mono text-violet-400 hover:text-violet-300 transition relative group">
                View all 
                <span className="relative">
                  →
                  <span className="absolute bottom-0 left-0 h-px bg-violet-500 w-0 group-hover:w-full transition-all duration-200" />
                </span>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272A transparent' }}>
              <div className="sticky top-0 bg-[#0E0E12] border-b border-[#1A1A1E]">
                <div className="flex items-center gap-4 px-4 py-2">
                  <div className="text-[10px] font-mono text-[#3F3F46] uppercase tracking-widest w-28 shrink-0">RUN ID</div>
                  <div className="text-[10px] font-mono text-[#3F3F46] uppercase tracking-widest flex-1">MODEL</div>
                  <div className="text-[10px] font-mono text-[#3F3F46] uppercase tracking-widest shrink-0">STATUS</div>
                  <div className="text-[10px] font-mono text-[#3F3F46] uppercase tracking-widest w-16 shrink-0">SCORE</div>
                  <div className="text-[10px] font-mono text-[#3F3F46] uppercase tracking-widest w-20 text-right shrink-0">DATE</div>
                </div>
              </div>
              {recentRuns && recentRuns.length > 0 ? (
                recentRuns.map((run: RecentRun, index: number) => (
                  <motion.div 
                    key={run.id} 
                    initial={{ opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="px-4 py-2.5 border-b border-[#1A1A1E] last:border-b-0 hover:bg-[rgba(255,255,255,0.02)] transition flex items-center gap-4 cursor-pointer"
                  >
                    <div className="font-mono text-[11px] text-[#52525B] truncate w-28 shrink-0">
                      {run.id.slice(0, 8)}...
                    </div>
                    <div className="font-mono text-[11px] text-[#A1A1AA] truncate flex-1">
                      {run.modelId}
                    </div>
                    <div className="shrink-0">
                      <RunStatusBadge status={run.status as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"} />
                    </div>
                    <div className="w-16 shrink-0">
                      {run.overallScore !== undefined && (
                        <div className={`font-mono font-bold text-sm ${
                          run.overallScore >= 0.75 ? "text-green-500" :
                          run.overallScore >= 0.5 ? "text-amber-500" : "text-red-500"
                        }`}>
                          {(run.overallScore * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-[#3F3F46] shrink-0 w-20 text-right">
                      {new Date(run.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-5 h-5 text-[#27272A] mb-2">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[#52525B] text-[12px] font-mono">No runs yet</p>
                </div>
              )}
            </div>
          </div>

          {/* REGRESSIONS PANEL */}
          <div className="bg-[#0C0C0F] border border-[#1A1A1E] rounded-xl overflow-hidden h-[340px] flex flex-col">
            <div className="px-4 py-3 border-b border-[#1A1A1E] flex items-center justify-between">
              <motion.h3 
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-[11px] font-mono text-[#52525B] uppercase tracking-widest"
              >
                Regressions
              </motion.h3>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                (stats?.regressionsCaught ?? 0) > 0 
                  ? "bg-red-950/60 text-red-400 border-red-900" 
                  : "bg-green-950/60 text-green-500 border-green-900"
              }`}>
                {(stats?.regressionsCaught ?? 0)}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272A transparent' }}>
              {(stats?.regressionsCaught ?? 0) > 0 ? (
                <div>
                  {regressions.map((run: AgentRun, index: number) => {
                    const prev = run.previousScore ?? 0;
                    const next = run.newScore ?? 0;
                    const delta = prev > 0 ? ((next - prev) / prev * 100).toFixed(0) : "0";

                    return (
                      <Link
                        key={run.id}
                        href={`/agent?agentRunId=${run.id}`}
                        className="block"
                      >
                        <motion.div 
                          initial={{ opacity: 0, x: 8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="px-4 py-3 border-b border-[#1A1A1E] last:border-b-0 hover:bg-[rgba(239,68,68,0.03)] transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[13px] font-medium text-[#FAFAFA]">
                                {run.deployment.name}
                              </span>
                              <span className="text-[11px] font-mono text-[#52525B]">
                                {formatTimeAgo(run.createdAt)}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[12px] text-[#A1A1AA]">
                                  {prev.toFixed(2)}
                                </span>
                                <span className="font-mono text-[12px] text-red-400 font-bold">
                                  →
                                </span>
                                <span className="font-mono text-[12px] text-red-400 font-bold">
                                  {next.toFixed(2)}
                                </span>
                              </div>
                              <span className="bg-red-950/40 text-red-400 border border-red-900/40 font-mono text-[10px] px-1.5 py-0.5 rounded">
                                {prev > 0 ? `${Number(delta) > 0 ? "+" : ""}${delta}%` : "0%"}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-5 h-5 text-green-500/40 mb-2">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[#52525B] text-[12px] font-mono mb-1">No regressions</p>
                  <p className="text-[#3F3F46] text-[11px] font-mono">All deployments passing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
