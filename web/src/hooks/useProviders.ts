import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomProvider } from "@/types";

// Fetch all active providers
export function useProviders() {
  return useQuery<CustomProvider[]>({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await fetch("/api/providers");
      if (!res.ok) throw new Error("Failed to fetch providers");
      return res.json();
    },
  });
}

// Create a new provider
export function useCreateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      baseUrl: string;
      modelId: string;
      apiKey?: string;
      description?: string;
      providerType?: string;
    }) => {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create provider");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}

// Update an existing provider
export function useUpdateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CustomProvider>;
    }) => {
      const res = await fetch(`/api/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update provider");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}

// Soft delete a provider
export function useDeleteProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/providers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete provider");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}

// Test connection — not a mutation, called imperatively
export async function testConnection(data: {
  baseUrl: string;
  modelId: string;
  apiKey?: string | null;
  providerId?: string;
}): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const res = await fetch("/api/providers/test-connection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return { ok: false, error: "Request failed" };
  return res.json();
}
