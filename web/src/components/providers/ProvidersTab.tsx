"use client";

import { useState } from "react";
import { Plus, Server } from "lucide-react";
import { useProviders } from "@/hooks/useProviders";
import { ProviderCard } from "./ProviderCard";
import { AddProviderForm } from "./AddProviderForm";

export function ProvidersTab() {
  const [showForm, setShowForm] = useState(false);
  const { data: providers, isLoading, isError } = useProviders();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-32 rounded-lg bg-[#111113] border border-[#27272A] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 border border-[#27272A] rounded-lg bg-[#111113]">
        <Server size={24} className="text-red-500" />
        <p className="text-sm text-[#A1A1AA] font-medium">Failed to load providers</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-[#FAFAFA] font-semibold text-sm">Custom Providers</h2>
          <p className="text-xs text-[#71717A]">
            Connect any OpenAI-compatible endpoint. Your model never leaves your
            servers.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            <Plus size={14} />
            Add Provider
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <AddProviderForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Provider list */}
      {providers && providers.length > 0 ? (
        <div className="flex flex-col gap-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : !showForm ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-3 py-16 border border-dashed border-[#27272A] rounded-lg bg-[#111113]">
          <Server size={24} className="text-[#71717A]" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-[#A1A1AA] font-medium">No custom providers yet</p>
            <p className="text-xs text-[#71717A] text-center max-w-xs">
              Connect your private fine-tuned model. Works with Ollama, vLLM,
              LiteLLM, HuggingFace TGI, and any OpenAI-compatible endpoint.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-md text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            Add Your First Provider
          </button>
        </div>
      ) : null}

      {/* Supported platforms note */}
      {providers && providers.length > 0 && (
        <p className="text-xs text-[#52525B]">
          Supports: Ollama · vLLM · LiteLLM · HuggingFace TGI · Azure OpenAI ·
          Together AI · any OpenAI-compatible endpoint
        </p>
      )}
    </div>
  );
}
