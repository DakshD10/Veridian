"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useDeleteProvider } from "@/hooks/useProviders";
import { ConnectionTestButton } from "./ConnectionTestButton";
import type { CustomProvider } from "@/types";

interface ProviderCardProps {
  provider: CustomProvider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const [showRetest, setShowRetest] = useState(false);
  const deleteProvider = useDeleteProvider();
  const queryClient = useQueryClient();

  async function handleDelete() {
    if (!confirm(`Remove "${provider.name}"? This cannot be undone.`)) return;
    try {
      await deleteProvider.mutateAsync(provider.id);
      toast.success("Provider removed");
    } catch {
      toast.error("Failed to remove provider");
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#111113] border border-[#27272A] rounded-lg">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* Provider name */}
          <span className="text-[#FAFAFA] font-semibold text-sm">{provider.name}</span>

          {/* Model ID — mono */}
          <span className="font-mono text-xs text-[#A1A1AA]">{provider.modelId}</span>

          {/* Base URL — muted */}
          <span className="font-mono text-xs text-[#52525B] truncate max-w-xs">
            {provider.baseUrl}
          </span>
        </div>

        {/* Status badge + latency */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {provider.lastTestOk ? (
            <div className="flex items-center gap-1.5 text-green-500">
              <CheckCircle2 size={13} />
              <span className="text-xs">Connected</span>
            </div>
          ) : provider.lastTestedAt ? (
            <div className="flex items-center gap-1.5 text-red-500">
              <XCircle size={13} />
              <span className="text-xs">Failed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-500">
              <Clock size={13} />
              <span className="text-xs">Not tested</span>
            </div>
          )}

          {/* Latency — mono */}
          {provider.lastTestOk && provider.lastLatencyMs !== null && provider.lastLatencyMs !== undefined && (
            <span className="font-mono text-xs text-[#52525B]">{provider.lastLatencyMs}ms</span>
          )}
        </div>
      </div>

      {/* Description */}
      {provider.description && <p className="text-xs text-[#71717A]">{provider.description}</p>}

      {/* Divider */}
      <div className="border-t border-[#1F1F23]" />

      {/* Action row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Re-test button */}
          <button
            type="button"
            onClick={() => setShowRetest((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-[#27272A] hover:bg-[#18181B] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
          >
            <RefreshCw size={12} />
            Re-test
          </button>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteProvider.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-red-500/40 hover:bg-red-950/20 text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>

      {/* Re-test panel — shown when Re-test clicked */}
      {showRetest && (
        <div className="p-3 bg-[#18181B] rounded-md border border-[#1F1F23]">
          <ConnectionTestButton
            baseUrl={provider.baseUrl}
            modelId={provider.modelId}
            apiKey={provider.apiKey}
            providerId={provider.id}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["providers"] });
              queryClient.invalidateQueries({ queryKey: ["models"] });
            }}
          />
        </div>
      )}
    </div>
  );
}
