"use client";

import { useQuery } from "@tanstack/react-query";
import { ModelCard, ModelOption } from "./ModelCard";

type AvailableModel = {
  id: string;
  label: string;
  speed: string;
  provider: "groq" | "gemini";
};

interface ModelRunFormProps {
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
}

function normalizeSpeed(speed: string): ModelOption["speed"] {
  return speed.toLowerCase().includes("very") ? "Very Fast" : "Fast";
}

function normalizeProvider(provider: AvailableModel["provider"]): ModelOption["provider"] {
  return provider === "gemini" ? "Gemini" : "Groq";
}

export function ModelRunForm({ selectedModelId, onSelectModel }: ModelRunFormProps) {
  const {
    data: models = [],
    isLoading: modelsLoading,
    isError,
  } = useQuery<AvailableModel[]>({
    queryKey: ["models"],
    queryFn: async () => {
      const res = await fetch("/api/models");
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
  });

  const options: ModelOption[] = models.map((model) => ({
    id: model.id,
    name: model.label,
    provider: normalizeProvider(model.provider),
    speed: normalizeSpeed(model.speed),
  }));

  if (modelsLoading) {
    return <p className="text-sm text-muted-foreground">Loading models...</p>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
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
          {options.length} AVAILABLE MODELS
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isSelected={selectedModelId === model.id}
            onSelect={onSelectModel}
          />
        ))}
      </div>
    </div>
  );
}
