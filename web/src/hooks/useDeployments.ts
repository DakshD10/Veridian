import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { WatchedDeployment } from "@/types";

export function useDeployments() {
  return useQuery<WatchedDeployment[]>({
    queryKey: ["deployments"],
    queryFn: () => api.get("/api/deployments") as Promise<WatchedDeployment[]>,
  });
}

export function useDeployment(id: string) {
  return useQuery<WatchedDeployment>({
    queryKey: ["deployment", id],
    queryFn: () => api.get(`/api/deployments/${id}`) as Promise<WatchedDeployment>,
    enabled: !!id,
  });
}
