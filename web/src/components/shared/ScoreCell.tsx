interface ScoreCellProps {
  score: number;
  previousScore?: number;
}

export function ScoreCell({ score, previousScore }: ScoreCellProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.75) {
      return "bg-green-950/40 text-green-500";
    } else if (score >= 0.5) {
      return "bg-amber-950/40 text-amber-500";
    } else {
      return "bg-red-950/40 text-red-500";
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 0.75) {
      return "bg-green-500";
    } else if (score >= 0.5) {
      return "bg-amber-500";
    } else {
      return "bg-red-500";
    }
  };

  const delta = previousScore !== undefined ? score - previousScore : null;
  const deltaColor = delta !== null && delta > 0 ? "text-green-500" : "text-red-500";
  const deltaPrefix = delta !== null && delta > 0 ? "+" : "";

  return (
    <div className={`p-2 rounded ${getScoreColor(score)}`}>
      <div className="font-mono font-bold text-sm">
        {(score * 100).toFixed(1)}%
      </div>
      
      {previousScore !== undefined && delta !== null && (
        <div className={`text-[11px] font-mono ${deltaColor} mt-1`}>
          {deltaPrefix}{(delta * 100).toFixed(1)}%
        </div>
      )}
      
      <div className="mt-2 h-0.75 rounded-full bg-[#1F1F23] overflow-hidden">
        <div 
          className={`h-full ${getBarColor(score)} transition-all duration-700`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );
}
