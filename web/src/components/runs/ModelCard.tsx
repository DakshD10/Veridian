import { Check } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  provider: "Groq" | "Gemini";
  speed: "Fast" | "Very Fast";
}

interface ModelCardProps {
  model: ModelOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  return (
    <div 
      onClick={() => onSelect(model.id)}
      className={`relative rounded-lg p-4 cursor-pointer transition-all duration-150 group flex flex-col items-start ${
        isSelected 
          ? "border-[1.5px] border-[#8B5CF6] bg-[rgba(139,92,246,0.06)] shadow-[0_0_0_3px_rgba(139,92,246,0.12)]" 
          : "border border-[#27272A] bg-[#111113] hover:border-[#3F3F46]"
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}

      <div className="font-sans text-[11px] font-medium text-[#52525B] uppercase tracking-wide">
        {model.provider}
      </div>
      <div className="font-sans text-[14px] font-semibold text-[#FAFAFA] mt-1">
        {model.name}
      </div>
      <div className="font-mono text-[11px] text-[#52525B] mt-0.5">
        {model.id}
      </div>
      
      <div className="mt-2 inline-flex bg-[#18181B] rounded px-2 py-0.5 items-center">
        <span className="font-sans text-[12px] font-medium text-[#A1A1AA]">
          ⚡ {model.speed}
        </span>
      </div>
    </div>
  );
}
