import { useQuery } from "@tanstack/react-query";
import type { ModelOption } from "@/types";

export function useModels() {
  return useQuery<ModelOption[]>({
    queryKey: ["models"],
    queryFn: async () => {
      const res = await fetch("/api/models");
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
    staleTime: 30_000, // Cache for 30s — models don't change often
  });
}

// Helper: group models by provider for display in dropdown
export function groupModelsByProvider(models: ModelOption[]) {
  const groups: Record<string, ModelOption[]> = {};
  for (const model of models) {
    const key = model.provider;
    if (!groups[key]) groups[key] = [];
    groups[key].push(model);
  }
  return groups;
}

// Provider display labels for section headers
export const PROVIDER_LABELS: Record<string, string> = {
  groq: "Groq Models",
  gemini: "Gemini Models",
  custom: "Custom Providers",
};
