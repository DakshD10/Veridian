"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, Activity, Shield, FileText, BarChart3, Bot, X, Loader2, ChevronDown, Zap, Eye, Target, Brain, Lock, Gauge } from "lucide-react";
import { useRouter } from "next/navigation";
import { LineChart, Line, ReferenceLine, Dot, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";

/* ──────────────────────────────────── TECH STACK LOGOS (SVG) ──────────────────────────────────── */

const NextjsLogo = () => (
  <svg viewBox="0 0 180 180" fill="none" className="w-10 h-10">
    <mask id="nMask" style={{maskType:'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
      <circle cx="90" cy="90" r="90" fill="black"/>
    </mask>
    <g mask="url(#nMask)">
      <circle cx="90" cy="90" r="90" fill="black" stroke="white" strokeWidth="6"/>
      <path d="M149.508 157.52L69.142 54H54v71.97h12.114V69.384l73.885 95.461A90.304 90.304 0 00149.508 157.52z" fill="url(#nGrad1)"/>
      <path d="M115 54h12v72h-12z" fill="url(#nGrad2)"/>
    </g>
    <defs>
      <linearGradient id="nGrad1" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="nGrad2" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

const TypeScriptLogo = () => (
  <svg viewBox="0 0 128 128" className="w-10 h-10">
    <path fill="#3178c6" d="M2 63.91v62.5h125v-125H2zm100.73-5.01h-11.36v48.56H80.15V58.9H68.71V47.59h34.02z"/>
    <path fill="#3178c6" d="M60.68 100.82a23.43 23.43 0 01-7.22-3.82l3.5-5.5a20.14 20.14 0 005.75 3.27 18.8 18.8 0 006.68 1.37c4.56 0 6.84-1.75 6.84-5.25a4.58 4.58 0 00-.82-2.81 6.48 6.48 0 00-2.81-1.93l-7.12-2.75a14.72 14.72 0 01-6.84-4.75 12.24 12.24 0 01-2.37-7.81 12.12 12.12 0 011.68-6.37 11.42 11.42 0 014.87-4.37 16.63 16.63 0 017.62-1.62 23.59 23.59 0 017.31 1.12 19.13 19.13 0 015.87 3.25l-3.25 5.62a15.88 15.88 0 00-4.87-2.75 15.14 15.14 0 00-5.25-1 7.23 7.23 0 00-4.43 1.18 3.88 3.88 0 00-1.62 3.31 4.37 4.37 0 001 2.93 8.58 8.58 0 003.31 2.18l6.75 2.62a14.17 14.17 0 016.25 4.37 11.1 11.1 0 012.12 7.06 12.63 12.63 0 01-1.68 6.56 11.34 11.34 0 01-5 4.43 17.5 17.5 0 01-7.93 1.62 26.29 26.29 0 01-8.62-1.37z"/>
  </svg>
);

const TailwindLogo = () => (
  <svg viewBox="0 0 256 154" className="w-12 h-10">
    <path fill="#06B6D4" d="M128 0Q96 0 80 32q24-16 48-8c7.55 2.52 12.95 7.93 18.95 13.94C157.1 48.08 168.94 60 192 60q32 0 48-32-24 16-48 8c-7.55-2.52-12.95-7.93-18.95-13.94C162.9 11.92 151.06 0 128 0zM64 60Q32 60 16 92q24-16 48-8c7.55 2.52 12.95 7.93 18.95 13.94C93.1 108.08 104.94 120 128 120q32 0 48-32-24 16-48 8c-7.55-2.52-12.95-7.93-18.95-13.94C98.9 71.92 87.06 60 64 60z"/>
  </svg>
);

const PythonLogo = () => (
  <svg viewBox="0 0 128 128" className="w-10 h-10">
    <linearGradient id="pyA" x1="12.96" y1="12.78" x2="79.64" y2="79.28" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#387EB8"/><stop offset="1" stopColor="#366994"/></linearGradient>
    <linearGradient id="pyB" x1="19.13" y1="20.43" x2="88.12" y2="89.15" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFE052"/><stop offset="1" stopColor="#FFC331"/></linearGradient>
    <path fill="url(#pyA)" d="M63.39 1.81c-4.08.04-7.97.41-11.47 1.03-10.36 1.83-12.24 5.66-12.24 12.73v9.33h24.49v3.11H25.68c-7.11 0-13.34 4.28-15.29 12.42-2.25 9.33-2.35 15.15 0 24.89 1.74 7.24 5.91 12.42 13.02 12.42h8.43V67.65c0-8.07 6.98-15.18 15.29-15.18h24.47c6.8 0 12.24-5.6 12.24-12.42V15.57c0-6.62-5.58-11.58-12.24-12.73-4.21-.73-8.58-1.07-12.62-1.03zm-13.22 7.3a4.65 4.65 0 014.69 4.69 4.66 4.66 0 01-4.69 4.72 4.67 4.67 0 01-4.69-4.72 4.66 4.66 0 014.69-4.69z"/>
    <path fill="url(#pyB)" d="M91.68 28.01v9.74c0 8.44-7.14 15.55-15.29 15.55H51.92c-6.71 0-12.24 5.74-12.24 12.45v23.34c0 6.63 5.76 10.53 12.24 12.45 7.76 2.3 15.2 2.71 24.47 0 6.15-1.8 12.24-5.41 12.24-12.45v-9.33H64.16v-3.11h36.71c7.11 0 9.76-4.96 12.24-12.42 2.56-7.67 2.45-15.05 0-24.89-1.76-7.09-5.12-12.42-12.24-12.42H91.68zm-14 56.15a4.67 4.67 0 014.69 4.72 4.66 4.66 0 01-4.69 4.69 4.65 4.65 0 01-4.69-4.69 4.66 4.66 0 014.69-4.72z"/>
  </svg>
);

const FastAPILogo = () => (
  <svg viewBox="0 0 154 154" className="w-10 h-10">
    <circle cx="77" cy="77" r="77" fill="#009688"/>
    <path d="M81.375 18.667l-38.75 70H77V144l38.75-70H81.375z" fill="white"/>
  </svg>
);

const LangChainLogo = () => (
  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a365d, #2d3748)' }}>
    <span className="text-white font-bold text-lg">🦜</span>
  </div>
);

const LangGraphLogo = () => (
  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2d3748, #4a5568)' }}>
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <circle cx="6" cy="6" r="2.5" fill="#10B981" stroke="#10B981" strokeWidth="0.5"/>
      <circle cx="18" cy="6" r="2.5" fill="#06B6D4" stroke="#06B6D4" strokeWidth="0.5"/>
      <circle cx="12" cy="18" r="2.5" fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="0.5"/>
      <line x1="7.5" y1="7.5" x2="11" y2="16" stroke="#a0aec0" strokeWidth="1"/>
      <line x1="16.5" y1="7.5" x2="13" y2="16" stroke="#a0aec0" strokeWidth="1"/>
      <line x1="8.5" y1="6" x2="15.5" y2="6" stroke="#a0aec0" strokeWidth="1"/>
    </svg>
  </div>
);

const GroqLogo = () => (
  <div className="w-10 h-10 rounded-lg bg-black border border-[#27272A] flex items-center justify-center">
    <span className="text-[#F55036] font-extrabold text-sm tracking-tighter">GROQ</span>
  </div>
);

const ZodLogo = () => (
  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#3E67B1' }}>
    <span className="text-white font-extrabold text-base">Z</span>
  </div>
);

const PrismaLogo = () => (
  <svg viewBox="0 0 159 194" className="w-8 h-10">
    <path fillRule="evenodd" clipRule="evenodd" d="M2.21 130.17l55.58 58.87c2.17 2.3 5.36 3.2 8.35 2.36l86.42-24.64c4.2-1.2 6.61-5.57 5.4-9.77a8.02 8.02 0 00-1.2-2.56L72.2 2.98C68.67-1.7 61.7-0.63 59.64 4.82L1.22 121.34a6.9 6.9 0 00.99 8.83z" fill="white"/>
    <path d="M60.76 7.03L118.26 150l-52.03 14.83z" fill="#2D3748"/>
  </svg>
);

const NeonLogo = () => (
  <div className="w-10 h-10 rounded-lg bg-black border border-[#27272A] flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path d="M4 4h4l4 16h-4L4 4zm8 0h4l4 16h-4l-4-16z" fill="#00E5FF" opacity="0.9"/>
    </svg>
  </div>
);

const PydanticLogo = () => (
  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#E92063' }}>
    <span className="text-white font-extrabold text-xs">PY</span>
  </div>
);

const techStack = [
  { Logo: NextjsLogo, name: "Next.js" },
  { Logo: TypeScriptLogo, name: "TypeScript" },
  { Logo: TailwindLogo, name: "Tailwind CSS" },
  { Logo: PythonLogo, name: "Python" },
  { Logo: FastAPILogo, name: "FastAPI" },
  { Logo: LangChainLogo, name: "LangChain" },
  { Logo: LangGraphLogo, name: "LangGraph" },
  { Logo: GroqLogo, name: "Groq" },
  { Logo: ZodLogo, name: "Zod" },
  { Logo: PrismaLogo, name: "Prisma" },
  { Logo: NeonLogo, name: "Neon" },
  { Logo: PydanticLogo, name: "Pydantic" },
];

/* ──────────────────────────────────── ARCHITECTURE DATA ──────────────────────────────────── */

const architectureNodes = {
  frontend: [
    { label: "Eval Suites", icon: "🧪" },
    { label: "Dashboard", icon: "📊" },
    { label: "Agent Watcher", icon: "🤖" },
    { label: "Red Team", icon: "🔴" },
  ],
  engine: [
    { label: "Veridian Eval Engine", sub: "Custom GroqJudge" },
    { label: "LangGraph Agents", sub: "8-Node Watcher · 6-Node Red Team" },
  ],
  infra: [
    { label: "GroqPool", sub: "3 Keys · 90 RPM", color: "#F55036" },
    { label: "Gemini Pool", sub: "2 Keys · 30 RPM", color: "#4285F4" },
    { label: "Neon Postgres", sub: "Serverless DB", color: "#00E5FF" },
  ],
};

/* ──────────────────────────────────── PROBLEM STATS DATA ──────────────────────────────────── */

const problemStats = [
  { value: "$67.4B", label: "Lost to AI hallucinations in 2024", color: "from-red-500/20 to-red-900/10", border: "border-red-900/40", text: "text-red-400" },
  { value: "80–95%", label: "AI projects fail to deliver real impact", color: "from-orange-500/20 to-orange-900/10", border: "border-orange-900/40", text: "text-orange-400" },
  { value: "42%", label: "Companies abandoned AI initiatives by 2025", color: "from-amber-500/20 to-amber-900/10", border: "border-amber-900/40", text: "text-amber-400" },
  { value: "4.3 hrs", label: "Per week per employee verifying AI outputs", color: "from-violet-500/10 to-violet-900/10", border: "border-violet-900/40", text: "text-violet-400" },
  { value: "$14,200", label: "Annual hallucination tax per employee", color: "from-blue-500/10 to-blue-900/10", border: "border-blue-900/40", text: "text-blue-400" },
  { value: "55%", label: "CIOs switched LLMs — losing months of context", color: "from-cyan-500/10 to-cyan-900/10", border: "border-cyan-900/40", text: "text-cyan-400" },
];

/* ──────────────────────────────────── MAIN PAGE COMPONENT ──────────────────────────────────── */

export default function RootPage() {
  const router = useRouter();
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentScore, setCurrentScore] = useState(0.88);
  const [regressionDetected, setRegressionDetected] = useState(false);
  const [activeNode, setActiveNode] = useState(0);

  // Demo data for charts
  const qualityData = [
    { time: "00:00", score: 0.92 },
    { time: "04:00", score: 0.89 },
    { time: "08:00", score: 0.87 },
    { time: "12:00", score: 0.91 },
    { time: "16:00", score: 0.85 },
    { time: "20:00", score: 0.72 },
    { time: "24:00", score: 0.78 },
  ];

  const modelComparison = [
    { model: "llama-3.3-70b", score: 0.88 },
    { model: "llama-4-maverick", score: 0.91 },
    { model: "gemini-2.0-flash", score: 0.85 },
  ];

  const agentNodes = [
    "trigger_received",
    "load_eval_suite",
    "run_model",
    "score_results",
    "compare_baseline",
    "root_cause",
    "generate_report",
    "notify"
  ];

  const [pipelineFlow, setPipelineFlow] = useState(0);
  const [alertActive, setAlertActive] = useState(false);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const simulateRegression = () => {
    setIsSimulating(true);
    setRegressionDetected(false);
    setActiveNode(0);
    setPipelineFlow(0);
    setAlertActive(false);

    const flowInterval = setInterval(() => {
      setPipelineFlow(prev => {
        if (prev >= 4) { clearInterval(flowInterval); return prev; }
        return prev + 1;
      });
    }, 600);

    const nodeInterval = setInterval(() => {
      setActiveNode(prev => {
        if (prev >= agentNodes.length - 1) {
          clearInterval(nodeInterval);
          setTimeout(() => {
            setCurrentScore(0.54);
            setRegressionDetected(true);
            setAlertActive(true);
            setTimeout(() => {
              setIsSimulating(false);
              setAlertActive(false);
            }, 3000);
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#020203] min-h-screen">

      {/* ═══════════════════════ NAVIGATION ═══════════════════════ */}
      <nav className="sticky top-0 z-50 bg-[#020203]/80 backdrop-blur-md border-b border-[#1A1A1E]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="font-bold text-[20px] text-[#FAFAFA] tracking-tight">
            Veridian
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-[14px] text-[#71717A]">
            <span onClick={() => scrollTo('problem')} className="hover:text-[#FAFAFA] transition cursor-pointer">Problem</span>
            <span onClick={() => scrollTo('agent')} className="hover:text-[#FAFAFA] transition cursor-pointer">Agent</span>
            <span onClick={() => scrollTo('architecture')} className="hover:text-[#FAFAFA] transition cursor-pointer">Architecture</span>
            <span onClick={() => scrollTo('techstack')} className="hover:text-[#FAFAFA] transition cursor-pointer">Tech Stack</span>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-lg px-5 py-2.5 font-semibold text-[14px] transition-all hover:shadow-lg hover:shadow-violet-500/25"
          >
            Open Dashboard →
          </button>
        </div>
      </nav>

      {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Ambient grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* LEFT — Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-violet-950/30 border border-violet-800/40 text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
            >
              <Zap size={14} /> Open-Source AI Quality Infrastructure
            </motion.div>

            <motion.h1
              className="font-bold text-[#FAFAFA] mb-8"
              style={{ fontSize: 'clamp(48px, 5.5vw, 68px)', lineHeight: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Catch{' '}
              <motion.span
                className="bg-linear-to-r from-violet-400 via-blue-400 to-violet-400 bg-clip-text text-transparent bg-size-[200%_100%]"
                animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                AI regressions
              </motion.span>
              <br />
              before your users do.
            </motion.h1>

            <motion.p
              className="text-[#A1A1AA] text-xl leading-relaxed mb-10 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Veridian continuously evaluates your AI models, detects quality drops autonomously, and alerts you — before production breaks.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139,92,246,0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard')}
                className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-8 py-4 text-base font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                Open Dashboard →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, borderColor: "#3F3F46", backgroundColor: "rgba(63, 63, 70, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo('problem')}
                className="border border-[#27272A] bg-transparent text-[#A1A1AA] px-8 py-4 text-base font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                Explore Below <ChevronDown size={18} />
              </motion.button>
            </motion.div>

            {/* Trust Row */}
            <motion.div
              className="flex flex-wrap gap-6 text-base text-[#71717A]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {[
                { icon: CheckCircle, text: "No infra setup", color: "text-green-400" },
                { icon: Bot, text: "Works with any LLM", color: "text-violet-400" },
                { icon: Shield, text: "DPDP audit-ready", color: "text-blue-400" }
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                >
                  <item.icon size={20} className={item.color} />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT — Pipeline Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="relative z-10"
          >
            <div className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-3xl p-10 relative overflow-hidden">
              {/* Grid */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
              </div>

              {/* Pipeline Nodes */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                  {[
                    { name: 'Input', icon: '→', active: pipelineFlow >= 0 },
                    { name: 'Model', icon: '🤖', active: pipelineFlow >= 1 },
                    { name: 'Eval Engine', icon: '⚡', active: pipelineFlow >= 2 },
                    { name: 'Score', icon: '📊', active: pipelineFlow >= 3 },
                    { name: 'Alert', icon: '🚨', active: pipelineFlow >= 4 }
                  ].map((node, index) => (
                    <motion.div
                      key={node.name}
                      className="flex flex-col items-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                    >
                      <motion.div
                        className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl transition-all duration-500 ${
                          node.active
                            ? alertActive && index === 4
                              ? 'border-red-500 bg-red-950/40 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.6)]'
                              : 'border-violet-500 bg-violet-950/40 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                            : 'border-[#27272A] bg-[#1A1A1A]'
                        }`}
                        animate={alertActive && index === 4 ? {
                          x: [0, -2, 2, -2, 2, 0],
                          y: [0, -2, 2, -2, 2, 0]
                        } : {}}
                        transition={{ duration: 0.3, repeat: alertActive && index === 4 ? Infinity : 0 }}
                      >
                        {node.icon}
                      </motion.div>
                      <span className="text-xs font-mono text-[#52525B] mt-3">{node.name}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Connecting Lines */}
                <div className="relative h-12 mb-8">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <motion.div
                      key={index}
                      className="absolute top-1/2 h-0.5 bg-linear-to-r from-violet-500 to-blue-500"
                      style={{
                        left: `${(index + 1) * 20 - 8}%`,
                        width: '16%',
                        transform: 'translateY(-50%)'
                      }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{
                        scaleX: pipelineFlow > index ? 1 : 0,
                        opacity: pipelineFlow > index ? 1 : 0
                      }}
                      transition={{ duration: 0.5, delay: 0.2 * index }}
                    />
                  ))}
                  {isSimulating && Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 w-2 h-2 bg-violet-400 rounded-full"
                      style={{ transform: 'translateY(-50%)' }}
                      animate={{ left: ['8%', '92%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.7 }}
                    />
                  ))}
                </div>

                {/* Score Display */}
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="relative inline-block">
                    <motion.div
                      className="text-6xl font-mono font-bold mb-2"
                      style={{
                        color: regressionDetected ? '#EF4444' : '#22C55E',
                        textShadow: regressionDetected ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(34,197,94,0.5)'
                      }}
                      animate={regressionDetected ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: regressionDetected ? 2 : 0 }}
                    >
                      {currentScore.toFixed(2)}
                    </motion.div>
                    {regressionDetected && (
                      <motion.div
                        className="absolute -top-4 -right-4 text-red-400 text-2xl"
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      >
                        ↓
                      </motion.div>
                    )}
                  </div>
                  <div className="text-base text-[#71717A] font-mono">
                    {regressionDetected ? 'REGRESSION DETECTED' : 'QUALITY SCORE'}
                  </div>
                </motion.div>

                {/* Simulate Button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(139,92,246,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={simulateRegression}
                  disabled={isSimulating}
                  className="w-full bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-6 py-4 rounded-xl font-mono text-base font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSimulating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      Simulating Regression...
                    </span>
                  ) : (
                    'Simulate Regression →'
                  )}
                </motion.button>
              </div>
            </div>

            {/* Glow */}
            <motion.div
              className="absolute inset-0 bg-linear-to-r from-violet-600/20 to-blue-600/20 rounded-3xl blur-xl -z-10"
              animate={alertActive ? { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] } : {}}
              transition={{ duration: 2, repeat: alertActive ? Infinity : 0 }}
            />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ PROBLEM STATS SECTION ═══════════════════════ */}
      <section id="problem" className="py-28 px-6 bg-[#020203] relative overflow-hidden">
        {/* Background radial */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.05)_0%,transparent_60%)]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-red-950/30 border border-red-900/40 text-red-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <AlertTriangle size={14} /> The Problem
            </motion.div>
            <h2 className="font-bold text-[#FAFAFA] text-5xl mb-6">
              AI teams are flying blind
            </h2>
            <p className="text-[#A1A1AA] text-xl max-w-2xl mx-auto">
              Models silently regress, hallucinations go undetected, and nobody knows until users are harmed. This is costing enterprises billions.
            </p>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {problemStats.slice(0, 3).map((stat, index) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ scale: 1.03, borderColor: 'rgba(239,68,68,0.5)' }}
                className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-8 text-center transition-all duration-300`}
              >
                <motion.div
                  className={`text-5xl font-bold ${stat.text} mb-3 font-mono`}
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 + 0.2, type: "spring", stiffness: 200 }}
                >
                  {stat.value}
                </motion.div>
                <p className="text-[#A1A1AA] text-base leading-relaxed">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problemStats.slice(3, 6).map((stat, index) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45 + index * 0.15, duration: 0.6 }}
                whileHover={{ scale: 1.03 }}
                className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-6 text-center transition-all duration-300`}
              >
                <motion.div
                  className={`text-3xl font-bold ${stat.text} mb-2 font-mono`}
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.45 + index * 0.15 + 0.2, type: "spring", stiffness: 200 }}
                >
                  {stat.value}
                </motion.div>
                <p className="text-[#71717A] text-sm leading-relaxed">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom quote */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
            className="text-center text-[#52525B] text-base mt-12 max-w-2xl mx-auto italic"
          >
            &ldquo;Every model switch throws away months of accumulated evaluation context. There is no version control for AI quality.&rdquo;
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════ AGENT SECTION ═══════════════════════ */}
      <section id="agent" className="py-24 px-6 bg-[#0A0A0B]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-violet-950/30 border border-violet-800/40 text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Bot size={14} /> Agentic Architecture
            </motion.div>
            <h2 className="font-bold text-[#FAFAFA] text-4xl mb-4">
              Your AI now has a watchdog.
            </h2>
            <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto">
              An 8-node LangGraph agent monitors your models autonomously, catching regressions with zero human intervention.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-[#FAFAFA] text-3xl mb-6">
                LangGraph-Powered Pipeline
              </h3>
              <p className="text-[#A1A1AA] text-lg mb-8 leading-relaxed">
                Our autonomous agent executes an 8-step evaluation pipeline — from triggering on model changes to firing Slack & Telegram alerts with full root cause analysis.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Eye, text: "Continuous deployment monitoring", color: "text-green-400" },
                  { icon: Activity, text: "Real-time scoring via GroqJudge (temp=0)", color: "text-violet-400" },
                  { icon: Brain, text: "Root cause analysis on failure clusters", color: "text-cyan-400" },
                  { icon: AlertTriangle, text: "Instant regression alerts (Slack + Telegram)", color: "text-red-400" },
                  { icon: Shield, text: "Full audit trail — every step logged", color: "text-blue-400" }
                ].map((item, index) => (
                  <motion.div
                    key={item.text}
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-[#0A0A0B] border ${item.color.replace('text-', 'border-')} flex items-center justify-center`}>
                      <item.icon size={24} className={item.color} />
                    </div>
                    <span className="text-[#A1A1AA] text-base">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right — Agent Graph */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#020203] border border-[#1A1A1E] rounded-3xl p-10 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.1) 1px, transparent 1px)',
                  backgroundSize: '30px 30px'
                }} />
              </div>

              <div className="relative z-10">
                <div className="relative h-96">
                  {agentNodes.map((node, index) => {
                    const positions = [
                      { x: 50, y: 5 },
                      { x: 20, y: 22 },
                      { x: 80, y: 22 },
                      { x: 50, y: 40 },
                      { x: 20, y: 58 },
                      { x: 80, y: 58 },
                      { x: 50, y: 76 },
                      { x: 50, y: 93 }
                    ];
                    const pos = positions[index];

                    return (
                      <motion.div key={node}>
                        <motion.div
                          className="absolute w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer"
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            borderColor: index < activeNode ? '#22C55E' :
                              index === activeNode ? '#8B5CF6' : '#27272A',
                            backgroundColor: index < activeNode ? 'rgba(34,197,94,0.1)' :
                              index === activeNode ? 'rgba(139,92,246,0.1)' : 'rgba(26,26,26,0.5)',
                            boxShadow: index === activeNode ? '0 0 30px rgba(139,92,246,0.5)' :
                              index < activeNode ? '0 0 20px rgba(34,197,94,0.3)' : 'none'
                          }}
                          whileHover={{ scale: 1.1 }}
                          animate={index === activeNode ? {
                            scale: [1, 1.05, 1], opacity: [1, 0.8, 1]
                          } : {}}
                          transition={{ duration: 1, repeat: index === activeNode ? Infinity : 0 }}
                        >
                          <div className="text-xs font-mono text-[#52525B] mb-1">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <div className={`text-[10px] font-mono text-center px-1 leading-tight ${
                            index < activeNode ? 'text-green-400' :
                              index === activeNode ? 'text-violet-400' : 'text-[#52525B]'
                          }`}>
                            {node.replace(/_/g, '\n')}
                          </div>
                        </motion.div>

                        {index < activeNode && (
                          <motion.div
                            className="absolute w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                            style={{
                              left: `calc(${pos.x}% + 30px)`,
                              top: `calc(${pos.y}% - 18px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <CheckCircle size={14} className="text-white" />
                          </motion.div>
                        )}

                        {index === activeNode && (
                          <motion.div
                            className="absolute w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center"
                            style={{
                              left: `calc(${pos.x}% + 30px)`,
                              top: `calc(${pos.y}% - 18px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Activity size={14} className="text-white animate-pulse" />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}

                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>

                    {[
                      { from: 0, to: 1 }, { from: 0, to: 2 },
                      { from: 1, to: 3 }, { from: 2, to: 3 },
                      { from: 3, to: 4 }, { from: 3, to: 5 },
                      { from: 4, to: 6 }, { from: 5, to: 6 },
                      { from: 6, to: 7 }
                    ].map((conn, index) => {
                      const positions = [
                        { x: 50, y: 5 }, { x: 20, y: 22 }, { x: 80, y: 22 },
                        { x: 50, y: 40 }, { x: 20, y: 58 }, { x: 80, y: 58 },
                        { x: 50, y: 76 }, { x: 50, y: 93 }
                      ];
                      const from = positions[conn.from];
                      const to = positions[conn.to];
                      const isActive = activeNode > conn.from && activeNode > conn.to;

                      return (
                        <motion.line
                          key={index}
                          x1={`${from.x}%`} y1={`${from.y}%`}
                          x2={`${to.x}%`} y2={`${to.y}%`}
                          stroke="url(#lineGradient)"
                          strokeWidth="2"
                          strokeDasharray={isActive ? "0" : "5,5"}
                          opacity={isActive ? 1 : 0.3}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.1 * index }}
                        />
                      );
                    })}
                  </svg>
                </div>

                <AnimatePresence>
                  {regressionDetected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-4 left-4 right-4 bg-red-950/40 border border-red-900 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-center gap-3 text-red-400 font-mono">
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 2 }}>
                          <AlertTriangle size={24} />
                        </motion.div>
                        <span className="text-base font-semibold">REGRESSION DETECTED — 0.88 → 0.54</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ DASHBOARD SECTION ═══════════════════════ */}
      <section className="py-24 px-6 bg-[#020203]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-blue-950/30 border border-blue-800/40 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <BarChart3 size={14} /> Quality Dashboard
            </motion.div>
            <h2 className="font-bold text-[#FAFAFA] text-5xl mb-6">
              Track quality over time
            </h2>
            <p className="text-[#A1A1AA] text-xl max-w-2xl mx-auto">
              Per-metric trends, model comparisons, regression indicators — all in one real-time dashboard.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Quality Trends */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.8 }}
              whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(139,92,246,0.2)", borderColor: "#8B5CF6" }}
              className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-3xl p-8 transition-all duration-300"
            >
              <h3 className="font-semibold text-[#FAFAFA] text-xl mb-6">Quality Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qualityData}>
                    <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} dot={false} animationDuration={2000} />
                    <ReferenceLine y={0.75} stroke="#F59E0B" strokeDasharray="8 4" strokeWidth={2} />
                    <Dot cx={120} cy={72} r={6} fill="#EF4444" stroke="#fff" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[#71717A] text-sm">Regression detected</span>
                <span className="text-red-400 font-mono text-sm">0.72 → 0.54</span>
              </div>
            </motion.div>

            {/* Model Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(139,92,246,0.2)", borderColor: "#8B5CF6" }}
              className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-3xl p-8 transition-all duration-300"
            >
              <h3 className="font-semibold text-[#FAFAFA] text-xl mb-6">Compare Models</h3>
              <div className="space-y-4">
                {modelComparison.map((model, index) => (
                  <motion.div
                    key={model.model}
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    onMouseEnter={() => setHoveredMetric(model.model)}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <span className={`font-mono text-sm transition-colors ${
                      hoveredMetric === model.model ? 'text-[#FAFAFA]' : 'text-[#71717A]'
                    }`}>
                      {model.model}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-3 bg-[#1A1A1E] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-linear-to-r from-violet-500 to-blue-500 rounded-full"
                          style={{ width: `${model.score * 100}%` }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${model.score * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.4 + index * 0.1 }}
                        />
                      </div>
                      <span className={`font-mono text-sm transition-colors ${
                        hoveredMetric === model.model ? 'text-[#FAFAFA]' : 'text-[#A1A1AA]'
                      }`}>
                        {model.score}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Metric Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(139,92,246,0.2)", borderColor: "#8B5CF6" }}
              className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-3xl p-8 transition-all duration-300"
            >
              <h3 className="font-semibold text-[#FAFAFA] text-xl mb-6">Metric Breakdown</h3>
              <div className="space-y-4">
                {[
                  { metric: "hallucination", score: 0.15, color: "bg-red-500", label: "Critical" },
                  { metric: "correctness", score: 0.88, color: "bg-green-500", label: "Excellent" },
                  { metric: "faithfulness", score: 0.92, color: "bg-green-500", label: "Excellent" },
                  { metric: "relevancy", score: 0.94, color: "bg-green-500", label: "Excellent" },
                ].map((item, index) => (
                  <motion.div
                    key={item.metric}
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    onMouseEnter={() => setHoveredMetric(item.metric)}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-mono text-sm uppercase tracking-wide transition-colors ${
                        hoveredMetric === item.metric ? 'text-[#FAFAFA]' : 'text-[#71717A]'
                      }`}>
                        {item.metric}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-sm font-bold transition-colors ${
                          hoveredMetric === item.metric ? 'text-[#FAFAFA]' :
                            item.color === 'bg-red-500' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {item.score}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.color === 'bg-red-500' ? 'bg-red-950/40 text-red-400 border border-red-900' : 'bg-green-950/40 text-green-400 border border-green-900'
                        }`}>
                          {item.label}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#1A1A1E] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.score * 100}%` }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.score * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ ARCHITECTURE SECTION ═══════════════════════ */}
      <section id="architecture" className="py-28 px-6 bg-[#0A0A0B] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Target size={14} /> System Design
            </motion.div>
            <h2 className="font-bold text-[#FAFAFA] text-5xl mb-6">
              Architecture
            </h2>
            <p className="text-[#A1A1AA] text-xl max-w-2xl mx-auto">
              Two services. Three API pools. One serverless database. Zero vendor lock-in.
            </p>
          </motion.div>

          {/* Architecture Diagram */}
          <div className="space-y-6">
            {/* Layer 1: Frontend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-violet-950/10 border border-violet-900/30 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
                <span className="font-mono text-violet-400 text-sm font-semibold">NEXT.JS 16 — Frontend + API Routes + Prisma ORM</span>
                <span className="font-mono text-[#52525B] text-xs ml-auto">localhost:3000</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {architectureNodes.frontend.map((node, i) => (
                  <motion.div
                    key={node.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    whileHover={{ scale: 1.05, borderColor: '#8B5CF6' }}
                    className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-xl p-4 text-center transition-all duration-200"
                  >
                    <div className="text-2xl mb-2">{node.icon}</div>
                    <div className="text-[#A1A1AA] text-sm font-medium">{node.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  className="w-0.5 h-8 bg-gradient-to-b from-violet-500 to-cyan-500"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                />
                <span className="text-[#52525B] text-xs font-mono">HTTP (Axios)</span>
                <motion.div
                  className="w-0.5 h-8 bg-gradient-to-b from-cyan-500 to-emerald-500"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                />
              </div>
            </motion.div>

            {/* Layer 2: Engine */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-emerald-950/10 border border-emerald-900/30 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-emerald-400 text-sm font-semibold">PYTHON EVAL ENGINE — FastAPI + LangGraph</span>
                <span className="font-mono text-[#52525B] text-xs ml-auto">localhost:3001</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {architectureNodes.engine.map((node, i) => (
                  <motion.div
                    key={node.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    whileHover={{ scale: 1.03, borderColor: '#10B981' }}
                    className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-xl p-5 transition-all duration-200"
                  >
                    <div className="text-[#FAFAFA] text-base font-semibold mb-1">{node.label}</div>
                    <div className="text-[#52525B] text-sm font-mono">{node.sub}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <motion.div
                className="w-0.5 h-10 bg-gradient-to-b from-emerald-500 to-cyan-500"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              />
            </motion.div>

            {/* Layer 3: Infrastructure */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {architectureNodes.infra.map((node, i) => (
                <motion.div
                  key={node.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 + i * 0.15 }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${node.color}20` }}
                  className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-2xl p-6 text-center transition-all duration-300"
                >
                  <div className="w-4 h-4 rounded-full mx-auto mb-4" style={{ backgroundColor: node.color, boxShadow: `0 0 20px ${node.color}60` }} />
                  <div className="text-[#FAFAFA] text-base font-semibold mb-1">{node.label}</div>
                  <div className="text-[#52525B] text-sm font-mono">{node.sub}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TECH STACK SECTION ═══════════════════════ */}
      <section id="techstack" className="py-28 px-6 bg-[#020203] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.04)_0%,transparent_60%)]" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-violet-950/30 border border-violet-800/40 text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Zap size={14} /> Powered By
            </motion.div>
            <h2 className="font-bold text-[#FAFAFA] text-5xl mb-6">
              Built With
            </h2>
            <p className="text-[#A1A1AA] text-lg max-w-xl mx-auto">
              Production-grade stack. Every tool chosen for a reason.
            </p>
          </motion.div>

          {/* Logo Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-5">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, type: "spring", stiffness: 200 }}
                whileHover={{
                  scale: 1.1,
                  borderColor: '#8B5CF6',
                  boxShadow: '0 0 30px rgba(139,92,246,0.2)',
                  backgroundColor: 'rgba(139,92,246,0.05)'
                }}
                className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-2xl p-6 flex items-center justify-center aspect-square transition-all duration-300 cursor-default group"
              >
                <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  <tech.Logo />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ WHY THIS MATTERS ═══════════════════════ */}
      <section className="py-24 px-6 bg-[#0A0A0B]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-bold text-[#FAFAFA] text-5xl mb-6">
              Why this matters
            </h2>
            <p className="text-[#A1A1AA] text-xl max-w-2xl mx-auto">
              The difference between silent failures and continuous confidence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Without Veridian */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-red-500/10 rounded-3xl blur-xl"
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative bg-red-950/20 border border-red-900/40 rounded-3xl p-10">
                <h3 className="font-semibold text-red-400 text-2xl mb-8">Without Veridian</h3>
                <div className="space-y-6">
                  {[
                    "No evaluation framework",
                    "Silent regressions in production",
                    "User complaints drive detection",
                    "Manual audit processes",
                    "Compliance risks"
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + index * 0.1 }}>
                        <X size={24} className="text-red-400" />
                      </motion.div>
                      <span className="text-[#A1A1AA] text-lg">{item}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 inline-flex items-center gap-2 bg-red-950/40 border border-red-900 px-4 py-2 rounded-full"
                >
                  <AlertTriangle size={16} className="text-red-400" />
                  <span className="text-red-400 font-mono text-sm">HIGH RISK</span>
                </motion.div>
              </div>
            </motion.div>

            {/* With Veridian */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-green-500/10 rounded-3xl blur-xl"
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative bg-green-950/20 border border-green-900/40 rounded-3xl p-10">
                <h3 className="font-semibold text-green-400 text-2xl mb-8">With Veridian</h3>
                <div className="space-y-6">
                  {[
                    "Continuous automated evaluation",
                    "Instant regression alerts",
                    "Proactive quality monitoring",
                    "Automated audit trails",
                    "DPDP compliance ready"
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 + index * 0.1, type: "spring" }}>
                        <CheckCircle size={24} className="text-green-400" />
                      </motion.div>
                      <span className="text-[#A1A1AA] text-lg">{item}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 inline-flex items-center gap-2 bg-green-950/40 border border-green-900 px-4 py-2 rounded-full"
                >
                  <Shield size={16} className="text-green-400" />
                  <span className="text-green-400 font-mono text-sm">PROTECTED</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ COMPLIANCE SECTION ═══════════════════════ */}
      <section className="py-24 px-6 bg-[#020203]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-bold text-[#FAFAFA] text-5xl mb-6">
              Audit Ready
            </h2>
            <p className="text-[#A1A1AA] text-xl max-w-2xl mx-auto">
              Complete traceability and explainability for every evaluation. One-click PDF reports.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - PDF Preview */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-3xl p-10 relative overflow-hidden">
                <motion.div
                  className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-violet-400 to-transparent"
                  animate={{ y: [0, 400, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ filter: 'blur(1px)' }}
                />
                <div className="relative z-10">
                  <div className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-2xl p-8 relative">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        {[4, 5, 3.5, 5, 3, 5, 2.5].map((w, i) => (
                          <div key={i} className="h-3 bg-[#1A1A1E] rounded" style={{ width: `${w * 20}%` }} />
                        ))}
                      </div>
                      <motion.div
                        initial={{ rotate: -15, opacity: 0 }}
                        whileInView={{ rotate: -5, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", damping: 10 }}
                        className="absolute top-4 right-4 bg-red-950/60 border border-red-900 text-red-400 font-mono font-bold px-4 py-2 rounded-lg shadow-lg"
                      >
                        AUDIT READY
                      </motion.div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="mt-8 p-6 bg-violet-950/20 border border-violet-900 rounded-2xl"
                    >
                      <div className="flex items-center gap-3 text-violet-400 font-mono text-base mb-3">
                        <FileText size={20} />
                        <span>COMPLIANCE REPORT</span>
                      </div>
                      <div className="text-[#A1A1AA] text-sm space-y-1">
                        <div>Full metric breakdown with judge reasoning</div>
                        <div>Per-test-case pass/fail with explanations</div>
                        <div>Model version & timestamps logged</div>
                        <div>DPDP compliant format</div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-[#FAFAFA] text-3xl mb-10">
                Complete compliance documentation
              </h3>
              <div className="space-y-8">
                {[
                  { icon: Shield, title: "Traceability", description: "Every evaluation logged with timestamps, model versions, and test case details.", delay: 0.1 },
                  { icon: BarChart3, title: "Metric Reasoning", description: "The judge explains WHY it scored each metric — not just a number.", delay: 0.2 },
                  { icon: FileText, title: "Explainability", description: "Full audit trail from input to output with intermediate steps documented.", delay: 0.3 }
                ].map((item) => (
                  <motion.div
                    key={item.title}
                    className="flex gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: item.delay }}
                    whileHover={{ x: 10 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      className="w-16 h-16 bg-violet-950/20 border border-violet-900 rounded-2xl flex items-center justify-center shrink-0"
                    >
                      <item.icon size={28} className="text-violet-400" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-[#FAFAFA] text-xl mb-3">{item.title}</h4>
                      <p className="text-[#A1A1AA] text-lg leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Only DPDP badge — the only real one */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="mt-12 inline-flex items-center gap-2 bg-[#0A0A0B] border border-[#1A1A1E] px-5 py-2.5 rounded-full font-mono text-sm text-violet-400"
              >
                <Shield size={14} /> DPDP Compliance Ready
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section className="py-32 px-6 bg-linear-to-b from-[#0A0A0B] to-[#020203] text-center relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 60%)",
              "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-bold text-[#FAFAFA] text-6xl mb-8"
            style={{ textShadow: "0 0 60px rgba(139,92,246,0.3)" }}
          >
            Stop shipping blind.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#A1A1AA] text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Every model update is a risk. Veridian catches regressions before your users do — autonomously, with full explainability.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(139,92,246,0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-12 py-5 text-xl font-bold rounded-2xl transition-all duration-300 shadow-xl border border-transparent"
            >
              Open Dashboard →
            </motion.button>
          </motion.div>

          {/* Impact Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16 flex flex-wrap justify-center gap-10"
          >
            {[
              { stat: "$67.4B", desc: "problem space" },
              { stat: "21×", desc: "faster red team" },
              { stat: "0", desc: "humans needed" },
            ].map((item, index) => (
              <motion.div
                key={item.stat}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold font-mono text-violet-400">{item.stat}</div>
                <div className="text-[#52525B] text-sm">{item.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-[#1A1A1E] py-10 px-6 bg-[#020203]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <div className="font-bold text-[#FAFAFA] text-lg mb-1">Veridian</div>
              <p className="text-[#52525B] text-sm">
                The truth layer for enterprise AI.
              </p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-[#52525B] text-sm mb-1">
                Team Cipher · TechnoTarang 2026
              </div>
              <div className="flex gap-4 text-xs text-[#3F3F46] font-mono justify-center sm:justify-end">
                <span>Next.js 16</span>
                <span>·</span>
                <span>FastAPI</span>
                <span>·</span>
                <span>LangGraph</span>
                <span>·</span>
                <span>Groq</span>
                <span>·</span>
                <span>Neon</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
