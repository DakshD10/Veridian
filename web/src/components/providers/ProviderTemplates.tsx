"use client";

import { PROVIDER_TEMPLATES, type ProviderTemplate } from "@/lib/providers";

interface ProviderTemplatesProps {
  selected: string | null;
  onSelect: (template: ProviderTemplate) => void;
}

export function ProviderTemplates({ selected, onSelect }: ProviderTemplatesProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wide text-[#71717A]">Quick Setup</p>
      <div className="flex flex-wrap gap-2">
        {PROVIDER_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              selected === template.id
                ? "bg-violet-500/12 border-violet-500/40 text-violet-500"
                : "bg-[#111113] border-[#27272A] text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]"
            }`}
          >
            {template.label}
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-xs text-[#52525B]">
          {PROVIDER_TEMPLATES.find((t) => t.id === selected)?.description}
        </p>
      )}
    </div>
  );
}
