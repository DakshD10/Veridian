import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface DashboardStats {
  totalSuites: number;
  totalRuns: number;
  regressionsCaught: number;
  avgScore: number;
}

interface TrendDataPoint {
  date: string;
  score: number;
  modelId: string;
}

interface ModelComparison {
  modelId: string;
  avgScore: number;
  runCount: number;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/api/dashboard"),
  });
}

export function useQualityTrend(suiteId?: string) {
  return useQuery<TrendDataPoint[]>({
    queryKey: ["quality-trend", suiteId],
    queryFn: () => {
      const query = suiteId ? `?suiteId=${encodeURIComponent(suiteId)}` : "";
      return api.get(`/api/dashboard/quality-trend${query}`);
    },
  });
}

export function useModelComparison(suiteId?: string) {
  return useQuery<ModelComparison[]>({
    queryKey: ["model-comparison", suiteId],
    queryFn: () => {
      const query = suiteId ? `?suiteId=${encodeURIComponent(suiteId)}` : "";
      return api.get(`/api/dashboard/model-comparison${query}`);
    },
  });
}

export function useDashboard() {
  const statsQuery = useDashboardStats();
  const trendQuery = useQualityTrend();
  const modelQuery = useModelComparison();

  return {
    stats: statsQuery.data,
    trendData: trendQuery.data,
    modelComparison: modelQuery.data,
    isLoading: statsQuery.isLoading || trendQuery.isLoading || modelQuery.isLoading,
  };
}
