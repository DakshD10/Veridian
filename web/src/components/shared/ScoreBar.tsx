interface ScoreBarProps {
  score: number;
}

export function ScoreBar({ score }: ScoreBarProps) {
  const getBarColor = (score: number) => {
    if (score >= 0.75) {
      return "#22C55E";
    } else if (score >= 0.5) {
      return "#F59E0B";
    } else {
      return "#EF4444";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#1F1F23] overflow-hidden">
        <div 
          className="h-full transition-all duration-700"
          style={{ 
            width: `${score * 100}%`,
            backgroundColor: getBarColor(score)
          }}
        />
      </div>
      <div className="w-10 text-right font-mono text-sm font-bold">
        {(score * 100).toFixed(0)}%
      </div>
    </div>
  );
}
