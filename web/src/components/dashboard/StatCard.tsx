import React from 'react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  deltaText?: string;
  deltaColor?: string;
  icon?: React.ReactNode;
  sparkline?: React.ReactNode;
}

export function StatCard({ label, value, deltaText, deltaColor, icon, sparkline }: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-[#111113] border border-[#1F1F23] rounded-lg px-[24px] py-[20px] flex flex-col gap-3 h-[140px]">
      {/* Label Top */}
      <span className="font-sans text-[12px] font-normal uppercase text-[#52525B] tracking-wider relative z-10 w-full flex justify-between">
        {label}
      </span>
      
      {/* Number Middle */}
      <div className="flex items-center gap-3 relative z-10 mt-1">
        {icon}
        <span className="font-mono text-[36px] font-bold text-[#FAFAFA] tracking-tight leading-none">
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
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none flex items-end justify-between px-[24px] z-0">
          {sparkline}
        </div>
      )}
    </div>
  );
}
