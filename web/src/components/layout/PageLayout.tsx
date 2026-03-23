"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actionButton?: {
    href: string;
    label: string;
    icon?: ReactNode;
  };
  stats?: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
}

export function PageLayout({ title, subtitle, children, actionButton, stats }: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full">
      {/* Header */}
      <div className="flex justify-between items-center h-[56px] px-8 border-b border-[#1F1F23] relative z-10">
        <div className="flex flex-col">
          <h1 className="font-sans text-[20px] font-bold text-[#FAFAFA]">{title}</h1>
          {subtitle && (
            <span className="font-sans text-[14px] text-[#71717A] mt-0.5">{subtitle}</span>
          )}
        </div>
        {actionButton && (
          <Link
            href={actionButton.href}
            className="border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 text-[13px] font-medium px-4 py-2 rounded-lg transition flex items-center gap-2 active:scale-[0.97] transition-transform duration-75"
          >
            {actionButton.icon}
            {actionButton.label}
          </Link>
        )}
      </div>

      {/* Stats Bar */}
      {stats && stats.length > 0 && (
        <div className="px-8 py-4 border-b border-[#1F1F23]">
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-[10px] font-mono text-[#52525B] uppercase tracking-widest">{stat.label}</span>
                <span className={`font-mono font-bold text-[16px] mt-1 ${stat.color || "text-[#FAFAFA]"}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-8 relative z-10">
        {children}
      </div>
    </div>
  );
}
