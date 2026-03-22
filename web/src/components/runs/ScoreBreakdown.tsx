import { MetricScore } from "@/hooks/useRun";

export function ScoreBreakdown({ metrics }: { metrics: MetricScore[] }) {
  
  const getFillColor = (score: number) => {
    if (score >= 0.7) return "bg-[#22C55E]";
    if (score >= 0.5) return "bg-[#F59E0B]";
    return "bg-[#EF4444]";
  };

  const getTextColor = (score: number) => {
    if (score >= 0.7) return "text-[#22C55E]";
    if (score >= 0.5) return "text-[#F59E0B]";
    return "text-[#EF4444]";
  };

  const getBadge = (score: number) => {
    if (score >= 0.7) return <span className="rounded px-2 py-0.5 font-mono text-[10px] w-12 text-center bg-[rgba(34,197,94,0.1)] text-[#22C55E]">PASS</span>;
    if (score >= 0.5) return <span className="rounded px-2 py-0.5 font-mono text-[10px] w-12 text-center bg-[rgba(245,158,11,0.1)] text-[#F59E0B]">WARN</span>;
    return <span className="rounded px-2 py-0.5 font-mono text-[10px] w-12 text-center bg-[rgba(239,68,68,0.1)] text-[#EF4444]">FAIL</span>;
  };

  const getBorderColor = (score: number) => {
    if (score >= 0.7) return "border-[rgba(34,197,94,0.4)]";
    if (score >= 0.5) return "border-[rgba(245,158,11,0.4)]";
    return "border-[rgba(239,68,68,0.4)]";
  };

  return (
    <div className="flex flex-col w-full">
      {metrics.map((m, i) => (
        <div key={i} className="mb-5 last:mb-0 flex flex-col w-full">
          {/* Row */}
          <div className="flex items-center gap-4 mb-2 w-full">
             <span className="font-sans font-medium text-[13px] text-[#FAFAFA] capitalize flex-1">
               {m.name.replace(/_/g, ' ')}
             </span>
             
             <div className="flex-1 h-[6px] bg-[#1F1F23] rounded-full mx-4 overflow-hidden flex items-center">
                <div className={`h-full rounded-full transition-all ${getFillColor(m.score)}`} style={{ width: `${Math.max(0, m.score * 100)}%` }} />
             </div>
             
             <span className={`font-mono font-bold text-[14px] w-10 text-right ${getTextColor(m.score)}`}>
               {m.score.toFixed(2)}
             </span>
             
             {getBadge(m.score)}
          </div>
          
          {/* JUDGE REASON */}
          <div className={`mt-2 pl-3 border-l-[2px] ${getBorderColor(m.score)}`}>
             <span className="font-sans italic font-normal text-[13px] text-[#71717A] leading-relaxed">
               {m.reason}
             </span>
          </div>
        </div>
      ))}
    </div>
  );
}
