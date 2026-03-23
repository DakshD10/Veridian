"use client";

import { motion } from "framer-motion";
import React, { useRef } from "react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  deltaText?: string;
  deltaColor?: string;
  icon?: React.ReactNode;
  sparkline?: React.ReactNode;
  index?: number;
}

export function StatCard({ label, value, deltaText, deltaColor, icon, sparkline, index = 0 }: StatCardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
      transition={{
        duration: 0.4,
        ease: [0.25, 1, 0.5, 1],
        delay: index * 0.06,
      }}
      whileHover={{
        y: -2,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.15)",
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
        },
      }}
      className={`relative overflow-hidden bg-[#111113] border border-[#1F1F23] rounded-lg px-[24px] py-[20px] flex flex-col gap-3 h-[140px] cursor-pointer transition-colors duration-200 ${
        label === "REGRESSIONS" && typeof value === "number" && value > 0 
          ? "border-red-900/30" 
          : label === "REGRESSIONS" && typeof value === "number" && value === 0 
          ? "border-green-900/20" 
          : ""
      }`}
    >
      {/* Label Top */}
      <span className="font-sans text-[12px] font-normal uppercase text-[#52525B] tracking-wider relative z-10 w-full flex justify-between">
        {label}
      </span>
      
      {/* Number Middle */}
      <div className="flex items-center gap-3 relative z-10 mt-1">
        {icon}
        <span className={`font-mono text-[36px] font-bold tracking-tight leading-none ${
          label === "REGRESSIONS" && typeof value === "number" && value > 0 
            ? "text-red-400" 
            : label === "REGRESSIONS" && typeof value === "number" && value === 0 
            ? "text-green-500" 
            : "text-[#FAFAFA]"
        }`}>
          {value}
        </span>
      </div>

      {/* Delta Below Number */}
      {deltaText && (
        <div className={`font-sans text-[12px] relative z-10 ${deltaColor || "text-[#71717A]"}`}>
          {deltaText}
        </div>
      )}
      
      {/* Sparkline Bottom */}
      {sparkline && (
        <motion.div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none flex items-end justify-between px-[24px] z-0">
          {sparkline}
        </motion.div>
      )}
    </motion.div>
  );
}
