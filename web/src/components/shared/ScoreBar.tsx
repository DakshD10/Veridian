"use client";

import { motion } from "framer-motion";

interface ScoreBarProps {
  score: number;
  index?: number;
  delay?: number;
}

export function ScoreBar({ score, index = 0, delay = 0 }: ScoreBarProps) {
  const getBarColor = (score: number) => {
    if (score >= 0.75) {
      return "#22C55E";
    } else if (score >= 0.5) {
      return "#F59E0B";
    } else {
      return "#EF4444";
    }
  };

  const barWidth = `${score * 100}%`;
  const animationDelay = index * 0.1 + delay;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-[#1F1F23] rounded-full h-[6px] overflow-hidden">
        <motion.div
          className="h-full"
          initial={{ width: "0%" }}
          animate={{ width: barWidth }}
          transition={{
            duration: 0.9,
            ease: [0.25, 1, 0.5, 1],
            delay: animationDelay,
          }}
          style={{
            backgroundColor: getBarColor(score),
          }}
        />
      </div>
      <div className="w-10 text-right font-mono text-sm font-bold">
        {(score * 100).toFixed(0)}%
      </div>
    </div>
  );
}
