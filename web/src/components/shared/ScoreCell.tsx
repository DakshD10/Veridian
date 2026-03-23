"use client";

import { motion } from "framer-motion";

interface ScoreCellProps {
  score: number;
  previousScore?: number;
  index?: number;
}

export function ScoreCell({ score, previousScore, index = 0 }: ScoreCellProps) {
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      className={`p-2 rounded ${getScoreColor(score)}`}
    >
      <div className="font-mono font-bold text-sm">
        {(score * 100).toFixed(1)}%
      </div>

      {previousScore !== undefined && delta !== null && (
        <div className={`text-[11px] font-mono ${deltaColor} mt-1`}>
          {deltaPrefix}{(delta * 100).toFixed(1)}%
        </div>
      )}

      <div className="mt-2 bg-[#1F1F23] rounded-full h-[6px] overflow-hidden">
        <motion.div
          className={`h-full ${getBarColor(score)}`}
          initial={{ width: "0%" }}
          animate={{ width: `${score * 100}%` }}
          transition={{
            duration: 0.9,
            ease: [0.25, 1, 0.5, 1],
            delay: index * 0.07 + 0.35,
          }}
        />
      </div>
    </motion.div>
  );
}
