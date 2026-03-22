"use client";

import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { QualityTrendChart } from "@/components/dashboard/QualityTrendChart";
import { ModelComparisonChart } from "@/components/dashboard/ModelComparisonChart";
import { CriticalRegressionsFeed } from "@/components/dashboard/CriticalRegressionsFeed";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDashboardStats,
  useQualityTrend,
  useModelComparison,
} from "@/hooks/useDashboard";
import { useSuites } from "@/hooks/useSuites";

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

function LoadingState() {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 gap-6">
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-[140px] rounded-lg bg-[#111113]" />
        <Skeleton className="h-[140px] rounded-lg bg-[#111113]" />
        <Skeleton className="h-[140px] rounded-lg bg-[#111113]" />
        <Skeleton className="h-[140px] rounded-lg bg-[#111113]" />
      </div>
      <div className="flex gap-6 w-full mt-2">
        <Skeleton className="w-[62%] h-[350px] rounded-lg bg-[#111113]" />
        <Skeleton className="w-[38%] h-[350px] rounded-lg bg-[#111113]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    data: suites = [],
    isLoading: suitesLoading,
    isError: suitesError,
  } = useSuites();

  const suiteList = suites as SuiteListItem[];
  const selectedSuiteId = suiteList[0]?.id;

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

  const isLoading =
    suitesLoading ||
    statsLoading ||
    (selectedSuiteId ? trendLoading || comparisonLoading : false);

  const isError =
    suitesError ||
    statsError ||
    (selectedSuiteId ? trendError || comparisonError : false);

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
      <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-sans text-[20px] font-bold text-[#FAFAFA]">Dashboard</h1>
          <Link
            href="/suites/new"
            className="bg-[#8B5CF6] text-white px-4 py-2 rounded-[6px] text-[14px] font-medium flex items-center gap-2 hover:bg-violet-600 transition-colors font-sans"
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
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full">
      <div className="flex justify-between items-center h-[56px] px-8 border-b border-[#1F1F23]">
        <h1 className="font-sans text-[20px] font-bold text-[#FAFAFA]">Dashboard</h1>
        <Link
          href="/suites/new"
          className="bg-[#8B5CF6] text-white px-4 py-2 rounded-[6px] text-[14px] font-medium flex items-center gap-2 hover:bg-violet-600 transition-colors font-sans"
        >
          <Plus className="w-4 h-4" />
          New Suite
        </Link>
      </div>

      <div className="p-8 flex flex-col gap-8 w-full">
        <div className="grid grid-cols-4 gap-4">
          <Link href="/suites" className="block">
            <StatCard label="TOTAL SUITES" value={stats?.totalSuites ?? 0} />
          </Link>
          <Link href="/runs" className="block">
            <StatCard label="TOTAL RUNS" value={stats?.totalRuns ?? 0} />
          </Link>
          <Link href="/runs" className="block">
            <StatCard
              label="REGRESSIONS"
              value={stats?.regressionsCaught ?? 0}
              icon={<AlertTriangle className="w-8 h-8 text-[#EF4444]" />}
            />
          </Link>
          <StatCard
            label="AVG QUALITY"
            value={stats?.avgScore?.toFixed(2) ?? "0.00"}
            deltaText={deltaText}
            deltaColor={deltaText ? deltaColor : undefined}
          />
        </div>

        <div className="flex gap-6 w-full">
          <div className="w-[62%]">
            <QualityTrendChart data={trendData} />
          </div>
          <div className="w-[38%]">
            <ModelComparisonChart data={modelComparisonData} />
          </div>
        </div>

        <div className="flex gap-6 w-full">
          <div className="w-[62%] flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-sans font-semibold text-sm text-[#FAFAFA]">Suites Overview</h3>
              <Link href="/suites" className="font-sans text-sm text-[#8B5CF6] hover:underline">
                View all suites →
              </Link>
            </div>
            <div className="w-full border border-[#1F1F23] rounded-lg overflow-hidden bg-[#111113]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1F1F23] text-xs font-semibold text-[#71717A] tracking-wider bg-[#09090B]">
                    <th className="py-3 px-4 uppercase font-sans font-medium">Suite</th>
                    <th className="py-3 px-4 uppercase font-sans font-medium">Domain</th>
                    <th className="py-3 px-4 uppercase font-sans font-medium">Test Cases</th>
                    <th className="py-3 px-4 uppercase font-sans font-medium">Runs</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#FAFAFA] divide-y divide-[#1F1F23]">
                  {suiteList.map((suite) => (
                    <tr key={suite.id} className="hover:bg-[#18181B] transition-colors">
                      <td className="py-3 px-4 font-sans text-[13px]">
                        <Link href={`/suites/${suite.id}`} className="hover:text-[#8B5CF6]">
                          {suite.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-sans text-[13px] text-[#A1A1AA]">
                        {suite.domain ?? "general"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px]">
                        {suite._count?.testCases ?? 0}
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px]">
                        {suite._count?.runs ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-[38%]">
            <CriticalRegressionsFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
