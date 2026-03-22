"use client";

import { useRouter } from "next/navigation";
import { Zap, Search, Bot } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#09090B] text-white selection:bg-[#8B5CF6]/30 font-[Inter] flex flex-col">
      {/* TOP NAV BAR */}
      <nav className="fixed top-0 w-full h-14 z-50 bg-[#09090B]/80 backdrop-blur-md border-b border-[#1F1F23] px-8 flex items-center justify-between">
        <div className="font-bold text-[18px] text-[#FAFAFA]">
          Veridian
        </div>
        
        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8 font-normal text-[14px] text-[#71717A]">
          <span className="hover:text-[#A1A1AA] transition cursor-pointer">Platform</span>
          <span className="hover:text-[#A1A1AA] transition cursor-pointer">Infrastructure</span>
          <span className="hover:text-[#A1A1AA] transition cursor-pointer">Engine</span>
          <span className="hover:text-[#A1A1AA] transition cursor-pointer">Documentation</span>
        </div>

        {/* Right */}
        <div className="flex items-center">
          <button className="border border-[#27272A] text-[#A1A1AA] rounded-lg px-4 py-1.5 font-medium text-[14px] hover:border-[#3F3F46] mr-3 transition bg-transparent">
            Sign In
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg px-4 py-1.5 font-medium text-[14px] transition"
          >
            Open Dashboard &rarr;
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="flex flex-col items-center justify-center pt-32 pb-16 text-center px-8 flex-1 min-h-screen">
        <div className="mb-6 font-mono text-[13px] text-[#52525B] tracking-widest uppercase mt-6">
          TECHNOTARANG 2026 &middot; LUNATICBYTES
        </div>
        
        <h1 className="mb-6 font-extrabold text-[64px] leading-tight text-[#FAFAFA] max-w-4xl mx-auto">
          Veridian &mdash; AI Quality Infrastructure
        </h1>
        
        <p className="mb-4 text-[20px] text-[#71717A] max-w-2xl mx-auto">
          The truth layer for enterprise AI.
        </p>

        {/* FEATURE PILLS ROW */}
        <div className="mb-16 flex gap-4 justify-center flex-wrap mt-6">
          <div className="bg-[#18181B] border border-[#27272A] rounded-full px-5 py-2 flex items-center gap-2 font-medium text-[14px] text-[#A1A1AA]">
            <Zap className="w-4 h-4 text-[#8B5CF6]" /> Groq-powered inference
          </div>
          <div className="bg-[#18181B] border border-[#27272A] rounded-full px-5 py-2 flex items-center gap-2 font-medium text-[14px] text-[#A1A1AA]">
            <Search className="w-4 h-4 text-[#8B5CF6]" /> Custom GroqJudge eval engine
          </div>
          <div className="bg-[#18181B] border border-[#27272A] rounded-full px-5 py-2 flex items-center gap-2 font-medium text-[14px] text-[#A1A1AA]">
            <Bot className="w-4 h-4 text-[#8B5CF6]" /> LangGraph autonomous agent
          </div>
        </div>

        {/* CTA BUTTONS ROW */}
        <div className="mb-24 flex gap-4 justify-center">
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg px-8 py-3 font-semibold text-[16px] transition"
          >
            Open Dashboard &rarr;
          </button>
          <button className="border border-[#27272A] bg-transparent text-[#A1A1AA] rounded-lg px-8 py-3 font-medium text-[16px] hover:border-[#3F3F46] transition">
            View on GitHub
          </button>
        </div>

        {/* SCREEN THUMBNAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto w-full text-left">
          
          {/* Thumbnail 1 — DASHBOARD */}
          <div className="group flex flex-col items-center">
            <div 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#111113] border border-[#1F1F23] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-hover:border-[#27272A] group-hover:scale-[1.02] transition-all duration-200 cursor-pointer h-48 p-4 flex flex-col"
            >
              <div className="flex gap-2 w-full">
                {["3", "12", "2", "0.78"].map((val, i) => (
                  <div key={i} className="flex-1 border-[2px] border-[#1F1F23] rounded bg-[#18181B] text-[8px] font-mono text-[#FAFAFA] flex items-center justify-center py-2 h-10">
                    {val}
                  </div>
                ))}
              </div>
              <div className="bg-[#18181B] rounded mt-2 flex-1 relative overflow-hidden flex items-end">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,60 L100,60" fill="none" stroke="#F59E0B" strokeWidth="1" />
                  <path d="M0,30 L20,40 L40,80 L60,30 L80,50 L100,20" fill="none" stroke="#8B5CF6" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <div className="font-mono text-[11px] text-[#52525B] uppercase tracking-wider text-center mt-3 font-semibold">
              DASHBOARD
            </div>
          </div>

          {/* Thumbnail 2 — EVAL SUITES */}
          <div className="group flex flex-col items-center">
            <div 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#111113] border border-[#1F1F23] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-hover:border-[#27272A] group-hover:scale-[1.02] transition-all duration-200 cursor-pointer h-48 p-4 flex flex-col justify-center gap-2"
            >
              <div className="bg-[#18181B] rounded p-2 flex flex-col justify-between h-[45%]">
                <div className="text-[8px] font-bold text-[#EF4444] tracking-wider">HEALTHCARE</div>
                <div className="h-2 w-full flex items-end">
                   <div className="h-[2px] w-full bg-[#8B5CF6] opacity-50"></div>
                </div>
              </div>
              <div className="bg-[#18181B] rounded p-2 flex flex-col justify-between h-[45%]">
                <div className="text-[8px] font-bold text-[#F59E0B] tracking-wider">BFSI</div>
                <div className="h-2 w-full flex items-end">
                   <div className="h-[2px] w-full bg-[#8B5CF6] opacity-50"></div>
                </div>
              </div>
            </div>
            <div className="font-mono text-[11px] text-[#52525B] uppercase tracking-wider text-center mt-3 font-semibold">
              EVAL SUITES
            </div>
          </div>

          {/* Thumbnail 3 — MODEL RUNNER */}
          <div className="group flex flex-col items-center">
            <div 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#111113] border border-[#1F1F23] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-hover:border-[#27272A] group-hover:scale-[1.02] transition-all duration-200 cursor-pointer h-48 p-4 flex gap-2"
            >
              <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5">
                <div className="bg-[#18181B] border border-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.3)] rounded-sm"></div>
                <div className="bg-[#18181B] border border-[#27272A] rounded-sm"></div>
                <div className="bg-[#18181B] border border-[#27272A] rounded-sm"></div>
                <div className="bg-[#18181B] border border-[#27272A] rounded-sm"></div>
              </div>
              <div className="w-[40%] bg-[#18181B] rounded-sm flex flex-col justify-end p-2 border border-[#27272A]">
                <div className="w-full h-4 bg-[#8B5CF6] rounded text-[6px] text-white flex items-center justify-center font-bold"></div>
              </div>
            </div>
            <div className="font-mono text-[11px] text-[#52525B] uppercase tracking-wider text-center mt-3 font-semibold">
              MODEL RUNNER
            </div>
          </div>

          {/* Thumbnail 4 — AGENT TRACE */}
          <div className="group flex flex-col items-center">
            <div 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#111113] border border-[#1F1F23] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-hover:border-[#27272A] group-hover:scale-[1.02] transition-all duration-200 cursor-pointer h-48 p-4 flex flex-col"
            >
              <div className="h-4 rounded bg-gradient-to-r from-[#450A0A] to-[#3F0A0A] mb-2"></div>
              {[1,2,3,4].map(n => (
                <div key={n} className="bg-[#18181B] rounded-sm h-[18px] mb-1 border-l-2 border-l-[#22C55E]"></div>
              ))}
              <div className="bg-[#18181B] rounded-sm h-[18px] mb-1 border-l-2 border-l-[#EF4444]"></div>
            </div>
            <div className="font-mono text-[11px] text-[#52525B] uppercase tracking-wider text-center mt-3 font-semibold">
              AGENT TRACE
            </div>
          </div>

          {/* Thumbnail 5 — SCORE BREAKDOWN */}
          <div className="group flex flex-col items-center">
            <div 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#111113] border border-[#1F1F23] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-hover:border-[#27272A] group-hover:scale-[1.02] transition-all duration-200 cursor-pointer h-48 p-4 flex flex-col"
            >
              <div className="bg-[#18181B] border border-[#27272A] rounded p-2 mb-2 flex justify-between items-center">
                <div className="w-8 h-1 bg-[#3F3F46] rounded"></div>
                <div className="text-[6px] font-bold text-[#EF4444] bg-[#450A0A] px-1 py-0.5 rounded">CRITICAL FAIL</div>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-1">
                <div className="h-1.5 rounded bg-[#F59E0B] w-[45%]"></div>
                <div className="h-1.5 rounded bg-[#22C55E] w-[95%]"></div>
                <div className="h-1.5 rounded bg-[#EF4444] w-[20%]"></div>
                <div className="h-1.5 rounded bg-[#EF4444] w-[15%]"></div>
              </div>
            </div>
            <div className="font-mono text-[11px] text-[#52525B] uppercase tracking-wider text-center mt-3 font-semibold">
              SCORE BREAKDOWN
            </div>
          </div>

          {/* Thumbnail 6 — DEPLOYMENTS */}
          <div className="group flex flex-col items-center">
            <div 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#111113] border border-[#1F1F23] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-hover:border-[#27272A] group-hover:scale-[1.02] transition-all duration-200 cursor-pointer h-48 p-4 flex flex-col justify-center"
            >
              <div className="bg-[#18181B] border border-[#27272A] rounded p-3">
                <div className="flex items-center gap-1 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></div>
                  <div className="text-[6px] text-[#22C55E] tracking-wider font-bold">WATCHING</div>
                </div>
                <div className="relative mt-2">
                  <div className="h-1.5 w-full bg-[#27272A] rounded"></div>
                  <div className="h-1.5 w-[88%] bg-[#22C55E] rounded absolute top-0 left-0"></div>
                  <div className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-[#F59E0B] left-[75%] rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="font-mono text-[11px] text-[#52525B] uppercase tracking-wider text-center mt-3 font-semibold">
              DEPLOYMENTS
            </div>
          </div>

        </div>
      </main>

      {/* BOTTOM TECH STACK STRIP */}
      <div className="border-t border-[#1F1F23] py-8 bg-[#09090B] mt-16">
        <div className="text-[#52525B] text-[13px] mb-4 text-center font-[Inter]">
          Built with
        </div>
        <div className="flex flex-wrap justify-center gap-2 px-8 max-w-4xl mx-auto">
          {["Next.js 15", "FastAPI", "LangGraph", "Neon PostgreSQL", "Groq", "Recharts", "TechnoTarang 2026"].map(tech => (
            <div key={tech} className="bg-[#18181B] border border-[#27272A] rounded px-3 py-1 font-mono text-[12px] text-[#71717A]">
              {tech}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-6 text-center bg-[#09090B]">
        <div className="font-mono text-[12px] text-[#3F3F46]">
          LunaticBytes &middot; TechnoTarang 2026 &middot; Veridian v0.1.0
        </div>
      </footer>
    </div>
  );
}
