"use client";

import { useMemo, useState } from "react";
import { Check, Lock, Search } from "lucide-react";
import { useModels } from "@/hooks/useModels";
import type { ModelOption } from "@/types";

interface ModelRunFormProps {
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
}

type ModelFamily = "all" | "llama" | "gpt-oss" | "qwen";

const FAMILY_FILTERS: Array<{ id: ModelFamily; label: string }> = [
  { id: "all", label: "All" },
  { id: "llama", label: "Llama" },
  { id: "gpt-oss", label: "GPT OSS" },
  { id: "qwen", label: "Qwen" },
];

function detectModelFamily(model: ModelOption): Exclude<ModelFamily, "all"> | null {
  const haystack = `${model.label} ${model.id}`.toLowerCase();
  if (haystack.includes("llama")) return "llama";
  if (haystack.includes("gpt-oss")) return "gpt-oss";
  if (haystack.includes("qwen")) return "qwen";
  return null;
}

function speedBadgeTone(speed: string): string {
  const value = speed.toLowerCase();
  if (value.includes("very fast") || value.includes("fast")) {
    return "text-[#22C55E]";
  }
  if (value.includes("stable")) {
    return "text-[#A1A1AA]";
  }
  return "text-[#A1A1AA]";
}

function speedBadgeLabel(speed: string): string {
  const value = speed.toLowerCase();
  if (value.includes("very fast") || value.includes("fast")) {
    return "⚡ Fast";
  }
  if (value.includes("stable")) {
    return "Stable";
  }
  return speed;
}

function formatProvider(provider: ModelOption["provider"]): string {
  if (provider === "groq") return "Groq";
  return "Custom";
}

export function ModelRunForm({ selectedModelId, onSelectModel }: ModelRunFormProps) {
  const { data: models, isLoading: modelsLoading, isError } = useModels();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<ModelFamily>("all");

  const filteredModels = useMemo(() => {
    const allModels = models ?? [];
    return allModels.filter((model) => {
      const modelFamily = detectModelFamily(model);
      const byFamily = family === "all" ? true : modelFamily === family;
      const haystack = `${model.label} ${model.id} ${model.provider}`.toLowerCase();
      const byQuery = query.trim() ? haystack.includes(query.trim().toLowerCase()) : true;
      return byFamily && byQuery;
    });
  }, [family, models, query]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-[#27272A] rounded-lg bg-[#111113]">
        <p className="text-sm text-red-500">Failed to load models.</p>
        <p className="text-xs text-[#71717A] mt-1">Check your connection and try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-end mb-4">
        <span className="font-sans text-[11px] font-medium text-[#52525B] uppercase tracking-widest">
          SELECT MODEL
        </span>
        <span className="font-sans text-[11px] font-medium text-[#3F3F46] uppercase tracking-widest">
          {filteredModels.length} SHOWN · {(models ?? []).length} AVAILABLE MODELS
        </span>
      </div>

      <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#52525B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search models..."
            className="w-full h-10 pl-9 pr-3 rounded-md bg-[#0E0E12] border border-[#27272A] text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FAMILY_FILTERS.map((item) => {
            const active = family === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFamily(item.id)}
                className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors ${
                  active
                    ? "bg-violet-500/15 text-violet-300 border-violet-500/40"
                    : "bg-[#0E0E12] text-[#71717A] border-[#27272A] hover:text-[#A1A1AA] hover:border-[#3F3F46]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {modelsLoading ? (
          <div className="text-sm text-[#71717A] py-8 text-center">Loading models...</div>
        ) : filteredModels.length === 0 ? (
          <div className="text-sm text-[#71717A] py-8 text-center border border-dashed border-[#27272A] rounded-lg">
            No models match current search/filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModels.map((model) => {
              const selected = selectedModelId === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => onSelectModel(model.id)}
                  className={`relative text-left rounded-lg p-4 transition-all duration-200 ${
                    selected
                      ? "bg-[rgba(139,92,246,0.06)] border-[1.5px] border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                      : "bg-[#111113] border border-[#27272A] hover:border-[#3F3F46]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-[#FAFAFA]">
                      {model.label}
                    </span>
                    <span className={`text-[10px] bg-[#18181B] px-2 py-0.5 rounded font-mono ${speedBadgeTone(model.speed)}`}>
                      {speedBadgeLabel(model.speed)}
                    </span>
                  </div>
                  <p className={`text-[11px] font-mono mb-1 break-all ${selected ? "text-[#8B5CF6]" : "text-[#A1A1AA]"}`}>
                    {model.id}
                  </p>
                  <p className="text-[10px] text-[#A1A1AA]/60">Provider: {formatProvider(model.provider)}</p>
                  {selected && (
                    <span className="absolute top-3 right-3 h-5 w-5 bg-[#8B5CF6] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-[#A1A1AA]">
            Judge: <span className="font-mono text-violet-300">Llama 3.3 70B</span>
          </span>
        </div>
      </div>
    </div>
  );
}
