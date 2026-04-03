"use client";

import {
  useModels,
  groupModelsByProvider,
  PROVIDER_LABELS,
} from "@/hooks/useModels";

interface ModelRunFormProps {
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
}

export function ModelRunForm({ selectedModelId, onSelectModel }: ModelRunFormProps) {
  const { data: models, isLoading: modelsLoading, isError } = useModels();
  const grouped = models ? groupModelsByProvider(models) : {};
  const orderedProviders = [
    "groq",
    "gemini",
    "custom",
    ...Object.keys(grouped).filter((key) => !["groq", "gemini", "custom"].includes(key)),
  ];

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
          {(models ?? []).length} AVAILABLE MODELS
        </span>
      </div>

      <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4">
        <label className="text-xs uppercase tracking-wide text-[#71717A] mb-2 block">
          Model
        </label>
        <select
          value={selectedModelId ?? ""}
          onChange={(e) => {
            if (e.target.value) onSelectModel(e.target.value);
          }}
          className="w-full bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] font-normal focus:outline-none focus:border-violet-500/50"
        >
          <option value="" disabled>
            {modelsLoading ? "Loading models..." : "Select a model..."}
          </option>

          {modelsLoading && <option disabled>Loading models...</option>}

          {models &&
            orderedProviders.map((provider) => {
              const providerModels = grouped[provider];
              if (!providerModels || providerModels.length === 0) return null;
              return (
                <optgroup
                  key={provider}
                  label={PROVIDER_LABELS[provider] ?? provider}
                >
                  {providerModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                      {model.provider === "custom"
                        ? ` (${model.speed})`
                        : ` · ${model.speed}`}
                    </option>
                  ))}
                </optgroup>
              );
            })}
        </select>
      </div>
    </div>
  );
}
