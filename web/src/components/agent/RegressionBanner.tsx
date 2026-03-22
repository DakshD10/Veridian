import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function LiveTimer({ isRunning }: { isRunning: boolean }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, [isRunning]);
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return <span className="font-mono font-bold text-[16px] text-[#FAFAFA]">{mins}:{secs}</span>;
}

interface RegressionBannerProps {
  regressionFound: boolean;
  previousScore: number;
  newScore: number;
  suiteName?: string;
  modelId?: string;
  reportSummary?: string | null;
}

export function RegressionBanner({ regressionFound, previousScore, newScore, suiteName, modelId, reportSummary }: RegressionBannerProps) {
  if (!regressionFound) return null;

  return (
      <div className="w-full z-20 h-[52px] flex items-center justify-between px-8 border-b border-solid border-[rgba(239,68,68,0.3)] animate-pulse transition-all duration-1000" style={{ background: "linear-gradient(135deg, #450A0A 0%, #3F0A0A 100%)" }}>
         <div className="flex items-center gap-3">
            <AlertTriangle className="w-[16px] h-[16px] text-[#EF4444]" />
            <span className="font-sans font-bold text-[13px] text-[#FCA5A5] uppercase tracking-wide">REGRESSION DETECTED</span>
            <span className="font-sans font-normal text-[13px] text-[#A1A1AA]">— Score dropped </span>
            {(suiteName || modelId) && (
              <span className="font-sans font-normal text-[13px] text-[#A1A1AA]">
                · {suiteName ?? "Suite"} ({modelId ?? "Model"})
              </span>
            )}
            <span className="font-mono font-bold text-[14px] text-[#EF4444]">
              {previousScore.toFixed(2)} → {newScore.toFixed(2)}
            </span>
            <span className="font-sans font-normal text-[13px] text-[#71717A]">· Rollback recommended</span>
         </div>
         <span className="font-sans font-medium text-[13px] text-[#8B5CF6] cursor-pointer hover:text-[#A78BFA] transition-colors">
            View Report →
         </span>
      </div>
    );
}
