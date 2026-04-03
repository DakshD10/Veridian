"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FlaskConical, History } from "lucide-react";
import { Suite } from "@/hooks/useSuites";

export function SuiteCard({ suite, index = 0 }: { suite: Suite; index?: number }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const domain = suite.domain ?? "general";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate offset from center, cap at 5 degrees
    const rotateY = Math.max(-5, Math.min(5, ((e.clientX - centerX) / (rect.width / 2)) * 5));
    const rotateX = Math.max(-5, Math.min(5, -((e.clientY - centerY) / (rect.height / 2)) * 5));

    setTilt({ rotateX, rotateY });

  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, root: scrollContainerRef, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ 
        y: -3, 
        boxShadow: "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.2)",
        transition: { type: "spring", stiffness: 280, damping: 22 }
      }}
      className="group"
    >
      <div
        ref={cardRef}
        onClick={() => router.push(`/suites/${suite.id}`)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative bg-[#111113] border border-[#1F1F23] rounded-lg p-6 cursor-pointer transition-colors duration-200 overflow-hidden"
        style={{
          transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          transition: "transform 0.1s ease-out, border-color 0.2s",
        }}
      >
      {/* Sheen effect */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)",
        }}
      />

      <span className="relative z-10 rounded px-2 flex items-center justify-center font-sans font-medium text-[11px] uppercase border h-5 bg-[#71717A]/10 border-[#71717A]/20 text-[#A1A1AA] w-fit">
        {domain}
      </span>

      <h3 className="relative z-10 font-sans font-semibold text-base text-[#FAFAFA] mt-3">{suite.name}</h3>

      <div className="relative z-10 w-full border-b border-[#1F1F23] my-4" />

      <div className="relative z-10 flex items-center gap-4 text-[#A1A1AA] w-full">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-[#52525B]" />
          <span className="font-sans text-[13px] font-normal">{suite._count?.testCases ?? 0} test cases</span>
        </div>
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-[#52525B]" />
          <span className="font-sans text-[13px] font-normal">{suite._count?.runs ?? 0} runs</span>
        </div>
      </div>

      <div className="relative z-10 mt-4 w-full flex justify-end">
        <Link
          href={`/suites/${suite.id}/run`}
          onClick={(e) => e.stopPropagation()}
          className="font-sans font-medium text-[13px] text-[#8B5CF6] hover:text-violet-300 transition relative group/link"
        >
          <span className="relative">
            Run Suite 
            <span className="relative">
              →
              <span className="absolute bottom-0 left-0 h-px bg-violet-500 w-0 group-hover/link:w-full transition-all duration-200" />
            </span>
          </span>
        </Link>
      </div>
      </div>
    </motion.div>
  );
}
