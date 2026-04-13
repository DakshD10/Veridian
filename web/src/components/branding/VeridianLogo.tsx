"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

type VeridianLogoProps = {
  size?: number;
  animated?: boolean;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

const nodes: [number, number][] = [
  [100, 20],
  [170, 60],
  [170, 140],
  [100, 180],
  [30, 140],
  [30, 60],
];

export function VeridianLogo({
  size = 36,
  animated = true,
  className,
  showWordmark = false,
  wordmarkClassName,
}: VeridianLogoProps) {
  const gradientId = useId();

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A2BE2" />
            <stop offset="50%" stopColor="#00C2FF" />
            <stop offset="100%" stopColor="#00FF94" />
          </linearGradient>
        </defs>

        <motion.polygon
          points="100,20 170,60 170,140 100,180 30,140 30,60"
          stroke={`url(#${gradientId})`}
          strokeWidth={8}
          fill="rgba(0,0,0,0.35)"
          initial={animated ? { pathLength: 0 } : undefined}
          animate={{ pathLength: 1 }}
          transition={animated ? { duration: 1.5, ease: "easeInOut" } : undefined}
        />

        {nodes.map(([cx, cy], i) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={5}
            fill={`url(#${gradientId})`}
            initial={animated ? { scale: 0 } : undefined}
            animate={{ scale: 1 }}
            transition={animated ? { delay: 1 + i * 0.08 } : undefined}
          />
        ))}

        <motion.path
          d="M75 85 L100 130 L125 85"
          stroke={`url(#${gradientId})`}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={animated ? { pathLength: 0 } : undefined}
          animate={{ pathLength: 1 }}
          transition={animated ? { duration: 1, delay: 1.2 } : undefined}
        />

        <motion.circle
          cx={100}
          cy={130}
          r={7}
          fill="#00FF94"
          initial={animated ? { scale: 0 } : undefined}
          animate={{ scale: 1 }}
          transition={animated ? { delay: 1.9 } : undefined}
        />
      </svg>
      {showWordmark && (
        <span className={cn("text-[#FAFAFA] font-semibold text-base tracking-tight", wordmarkClassName)}>
          Veridian
        </span>
      )}
    </div>
  );
}
