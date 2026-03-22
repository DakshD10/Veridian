export function ThresholdGauge({ score, threshold }: { score: number; threshold: number }) {
  const fillWidth = Math.min(Math.max(score * 100, 0), 100);
  const thresholdLeft = Math.min(Math.max(threshold * 100, 0), 100);

  return (
    <div className="relative pt-6 w-full">
      {/* Score indicator above track */}
      <div 
        className="absolute top-0 -translate-x-1/2 mb-1 flex flex-col items-center z-10" 
        style={{ left: `${fillWidth}%` }}
      >
        <span className="text-[12px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 px-1.5 rounded">
          {score.toFixed(2)}
        </span>
        <div className="w-0.5 h-2 bg-[#22C55E]"></div>
      </div>

      {/* Progress Track */}
      <div className="h-2.5 w-full bg-[#1F1F23] rounded-full overflow-hidden relative">
        <div 
          className="h-full bg-[#22C55E] rounded-full shadow-[0_0_12px_rgba(34,197,94,0.3)] transition-all duration-1000 ease-out" 
          style={{ width: `${fillWidth}%` }}
        ></div>
      </div>

      {/* Threshold Marker */}
      <div 
        className="absolute -bottom-1 -translate-x-1/2 flex flex-col items-center pointer-events-none" 
        style={{ left: `${thresholdLeft}%` }}
      >
        <div className="w-0.5 h-6 bg-[#F59E0B]"></div>
        <span className="text-[10px] font-mono text-[#F59E0B] mt-1 whitespace-nowrap">
          THRESHOLD: {threshold.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
