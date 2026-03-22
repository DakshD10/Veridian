import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

export function TraceNode({ 
  nodeKey, name, summary, timing, state, reportText, isRegression 
}: { 
  nodeKey: string, name: string, summary: string, timing: string, state: "DONE"|"RUNNING"|"PENDING", reportText?: string, isRegression?: boolean 
}) {
  if (state === "PENDING") {
    return (
      <div className="border border-solid border-[#1F1F23] rounded-lg p-4 border-l-[3px] border-l-[#27272A] bg-[#111113]">
        <div className="flex items-start gap-4">
          <Clock className="w-[18px] h-[18px] text-[#3F3F46] mt-0.5" />
          <div className="flex flex-col flex-1">
             <span className="font-sans font-semibold text-[14px] text-[#52525B]">{name}</span>
             <span className="font-sans text-[12px] text-[#3F3F46] mt-0.5">{summary}</span>
          </div>
          <span className="font-mono text-[12px] text-[#3F3F46] ml-auto self-start">—:—</span>
        </div>
      </div>
    );
  }

  if (state === "RUNNING") {
    return (
      <div className="border border-solid border-[rgba(139,92,246,0.4)] rounded-lg p-4 border-l-[3px] border-l-[#8B5CF6] bg-[rgba(139,92,246,0.04)]">
        <div className="flex items-start gap-4">
          <Loader2 className="w-[18px] h-[18px] text-[#8B5CF6] animate-spin mt-0.5" />
          <div className="flex flex-col flex-1">
             <span className="font-sans font-semibold text-[14px] text-[#FAFAFA]">{name}</span>
             <span className="font-sans italic text-[13px] text-[#8B5CF6] mt-0.5">Evaluating target variables via trace checks...</span>
          </div>
          <span className="font-sans font-medium text-[12px] text-[#8B5CF6] ml-auto self-start">Running</span>
        </div>
      </div>
    );
  }

  const isFailedBaseline = nodeKey === "compare_baseline" && isRegression;
  const isExpandedReport = nodeKey === "generate_report" && reportText;

  return (
    <div className={`border border-solid border-[#1F1F23] rounded-lg p-4 border-l-[3px] ${isFailedBaseline ? "border-l-[#EF4444]" : "border-l-[#22C55E]"} ${isExpandedReport ? "bg-[rgba(139,92,246,0.04)] border-[rgba(139,92,246,0.2)]" : "bg-[#111113]"}`}>
      <div className="flex items-start gap-4 w-full">
        {isFailedBaseline ? (
          <XCircle className="w-[18px] h-[18px] text-[#EF4444] flex-shrink-0 mt-0.5 tracking-tight" />
        ) : (
          <CheckCircle2 className="w-[18px] h-[18px] text-[#22C55E] flex-shrink-0 mt-0.5 tracking-tight" />
        )}
        <div className="flex flex-col flex-1 w-full max-w-full">
           <span className="font-sans font-semibold text-[14px] text-[#FAFAFA]">{name}</span>
           <span className="font-sans font-normal text-[13px] text-[#71717A] mt-0.5">{summary}</span>
           
           {isFailedBaseline && (
             <span className="font-sans font-medium text-[11px] text-[#EF4444] uppercase tracking-widest mt-1">
               ⚠ BELOW THRESHOLD
             </span>
           )}
           
           {isExpandedReport && (
             <div className="mt-3 pt-3 border-t border-solid border-[rgba(139,92,246,0.15)] flex flex-col w-full">
               <span className="font-sans font-medium text-[11px] text-[#8B5CF6] uppercase tracking-widest mb-2">AI REPORT</span>
               <span className="font-sans italic font-normal text-[13px] text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">
                 {reportText}
               </span>
             </div>
           )}
        </div>
        <span className="font-mono text-[12px] text-[#52525B] ml-auto self-start leading-none mt-1">{timing}</span>
      </div>
    </div>
  );
}
