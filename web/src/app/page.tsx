"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  AlertTriangle, CheckCircle, Activity, Shield, FileText, 
  BarChart3, Bot, X, Loader2, Zap, ArrowRight, Spline, Sparkles, Cpu, Layers, GitBranch, ArrowUpRight, Database, Terminal, Code, Users, Settings, Lock, Network, Key
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LineChart, Line, ReferenceLine, Dot, ResponsiveContainer, Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

// Linear style grid background component
// Premium Background with floating beams and refined grid
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Dynamic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_-20%,#000_60%,transparent_110%)]"></div>
      
      {/* Animated Beams */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            x: ["-100%", "200%"],
            y: ["-20%", "20%"]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] left-0 w-[40%] h-[1px] bg-linear-to-r from-transparent via-violet-500/30 to-transparent rotate-[25deg] blur-sm"
        />
        <motion.div 
          animate={{ 
            x: ["200%", "-100%"],
            y: ["20%", "-20%"]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[60%] right-0 w-[50%] h-[1px] bg-linear-to-r from-transparent via-blue-500/20 to-transparent rotate-[-15deg] blur-sm"
        />
      </div>

      {/* Ambient Glows */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[1000px] h-[800px] bg-violet-600/10 opacity-60 blur-[150px] rounded-full mix-blend-screen"></div>
      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/10 opacity-40 blur-[150px] rounded-full mix-blend-screen"></div>
    </div>
  );
}

function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => { setIsFocused(true); setOpacity(1); }}
      onBlur={() => { setIsFocused(false); setOpacity(0); }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden group transition-colors ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-0 mix-blend-screen"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(139,92,246,0.06), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
export default function RootPage() {
  const router = useRouter();
  
  // -- Hero / Agent Simulation State --
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentScore, setCurrentScore] = useState(0.88);
  const [regressionDetected, setRegressionDetected] = useState(false);
  const [activeNode, setActiveNode] = useState(0);
  const [pipelineFlow, setPipelineFlow] = useState(0);
  const [alertActive, setAlertActive] = useState(false);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Demo Data
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
    { model: "llama-3-70b", score: 0.88 },
    { model: "gpt-4o", score: 0.91 },
    { model: "claude-3.5", score: 0.85 },
  ];

  const agentNodes = [
    { id: "trigger", label: "Trigger Received", type: "input" },
    { id: "load", label: "Load Eval Suite", type: "process" },
    { id: "run", label: "Run Model", type: "process" },
    { id: "score", label: "Score Results", type: "process" },
    { id: "compare", label: "Compare Baseline", type: "decision" },
    { id: "report", label: "Generate Report", type: "output" },
    { id: "notify", label: "Notify Team", type: "output" }
  ];

  const simulateRegression = () => {
    setIsSimulating(true);
    setRegressionDetected(false);
    setActiveNode(0);
    setPipelineFlow(0);
    setAlertActive(false);
    
    const flowInterval = setInterval(() => {
      setPipelineFlow(prev => {
        if (prev >= 4) {
          clearInterval(flowInterval);
          return prev;
        }
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
            }, 4000);
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
  };

  return (
    <div className="bg-[#000000] min-h-screen text-[#EDEDED] font-sans selection:bg-violet-500/30 relative">
      <GridBackground />

      {/* Floating Glass Navbar */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-6 inset-x-0 mx-auto max-w-5xl z-50 px-6 sm:px-0 pointer-events-none"
      >
        <div className="mx-auto flex h-14 items-center justify-between rounded-full border border-white/10 bg-black/40 px-6 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-auto">
          <div className="flex items-center gap-3">
            <Logo className="w-6 h-6 shrink-0" />
            <span className="font-semibold text-sm tracking-wide text-white">Veridian</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#888888]">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#agent" className="hover:text-white transition-colors">Agent</Link>
            <Link href="#dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="#" className="hover:text-white transition-colors">Docs</Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-[13px] font-medium text-[#888888] hover:text-white transition-colors hidden sm:block">
              Log In
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="relative group overflow-hidden rounded-full p-[1px]"
            >
              <span className="absolute inset-0 bg-linear-to-r from-violet-600 to-blue-600 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></span>
              <div className="relative bg-black rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10 transition-colors group-hover:bg-black/50">
                <span className="text-[13px] font-medium text-white">Get Started</span>
                <ArrowRight size={14} className="text-violet-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION - Linear / Next.js Style */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col justify-center items-center pt-32 pb-20 px-6 overflow-hidden">
        <motion.div style={{ y, opacity }} className="max-w-5xl mx-auto w-full z-10 flex flex-col items-center">
          
          {/* Top Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 px-3 text-xs font-medium text-[#888888] backdrop-blur-md">
              <Zap size={14} className="text-violet-400" />
              <span className="border-l border-white/10 pl-2 ml-1">Introducing Veridian Autonomous Evaluator</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            className="text-center font-medium tracking-tighter text-white mb-8 max-w-4xl"
            style={{ fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.95 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            Experience model <br className="hidden md:block" />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-linear-to-b from-white via-white to-white/40">
                absolute certainty.
              </span>
              <motion.span 
                className="absolute inset-0 bg-linear-to-r from-transparent via-violet-400/20 to-transparent -skew-x-12"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              />
            </span>
          </motion.h1>

          <motion.p 
            className="text-center text-[#888888] text-lg md:text-xl max-w-2xl mb-12 font-light leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            The truth layer for enterprise AI. Veridian continuously evaluates your LLMs, detects regressions, and alerts your team before quality drops in production.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center gap-4 mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-white text-black px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#EAEAEA] transition-colors flex items-center gap-2 group w-full sm:w-auto justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              Start Evaluating
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-white/10 transition-colors w-full sm:w-auto justify-center">
              Read Documentation
            </button>
          </motion.div>

          {/* REAL-TIME PIPELINE VIZ */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
            className="w-full relative"
          >
            <div className="absolute -inset-1 bg-linear-to-r from-violet-600 to-blue-600 rounded-[32px] blur-2xl opacity-20 transform -translate-y-4"></div>
            
            <div className="relative bg-[#09090B] border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl overflow-hidden">
              {/* Grid inside container */}
              <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/djeghrtji/image/upload/v1714421876/grid-dark_s5k5hx.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                
                {/* Visualizer Flow */}
                <div className="flex-1 w-full flex items-center justify-between relative">
                  {/* Connection Line with Kinetic Pulse */}
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/5 -translate-y-1/2 overflow-hidden">
                    {/* Continuous subtle flow */}
                    <motion.div 
                      className="absolute top-0 bottom-0 w-64 bg-linear-to-r from-transparent via-violet-500/10 to-transparent opacity-50"
                      animate={{ left: ['-100%', '200%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Simulation Packets */}
                    {isSimulating && (
                      <AnimatePresence>
                        {[...Array(3)].map((_, i) => (
                          <motion.div 
                            key={i}
                            initial={{ left: "-10%" }}
                            animate={{ left: "110%" }}
                            transition={{ 
                              duration: 2, 
                              delay: i * 0.6, 
                              repeat: Infinity, 
                              ease: "easeInOut" 
                            }}
                            className="absolute top-0 bottom-0 w-20 bg-linear-to-r from-transparent via-blue-400 to-transparent z-20"
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>

                  {[
                    { id: 'input', label: 'Trigger', icon: Activity, active: pipelineFlow >= 0 },
                    { id: 'model', label: 'Target Model', icon: Cpu, active: pipelineFlow >= 1 },
                    { id: 'engine', label: 'Eval Engine', icon: Layers, active: pipelineFlow >= 2 },
                    { id: 'score', label: 'Scoring', icon: BarChart3, active: pipelineFlow >= 3 },
                    { id: 'alert', label: 'Monitor', icon: AlertTriangle, active: pipelineFlow >= 4 }
                  ].map((node, index) => (
                    <div key={node.id} className="relative flex flex-col items-center gap-4 z-10">
                      <motion.div
                        className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border backdrop-blur-md transition-all duration-500
                          ${node.active 
                            ? alertActive && index === 4 
                              ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                              : 'bg-violet-500/10 border-violet-500/50 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                            : 'bg-black/50 border-white/10 text-[#555]'
                          }
                        `}
                        animate={alertActive && index === 4 ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.5, repeat: alertActive && index === 4 ? Infinity : 0 }}
                      >
                        <node.icon size={24} strokeWidth={1.5} />
                      </motion.div>
                      <span className="text-[11px] font-mono tracking-wider uppercase text-[#888] absolute -bottom-8 whitespace-nowrap hidden md:block">
                        {node.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Score Controller Card */}
                <div className="w-full md:w-80 bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-xs font-mono text-[#888] mb-1">CURRENT BASELINE</div>
                      <div className={`text-4xl font-light font-mono tracking-tight transition-colors duration-500 ${regressionDetected ? 'text-red-500' : 'text-white'}`}>
                        {currentScore.toFixed(2)}
                      </div>
                    </div>
                    {regressionDetected && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono px-2 py-1 rounded"
                      >
                        FAILING
                      </motion.div>
                    )}
                  </div>

                  <button
                    onClick={simulateRegression}
                    disabled={isSimulating}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors duration-200 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSimulating ? (
                      <><Loader2 size={16} className="animate-spin text-violet-400" /> Processing...</>
                    ) : (
                      <><Zap size={16} className="text-violet-400 group-hover:scale-110 transition-transform" /> Simulate Regression</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </section>


      {/* BENTO GRID FEATURES */}
      <section id="features" className="py-24 px-6 relative z-20 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Infrastructure designed for <span className="text-violet-400">certainty.</span></h2>
            <p className="text-[#888888] text-lg max-w-2xl">A complete testing suite built from the ground up to prevent AI failures without slowing down your shipping velocity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            {/* Box 1: Langgraph Pipeline */}
            <SpotlightCard className="md:col-span-2 bg-linear-to-b from-[#0C0C0E] to-[#010101] border border-white/5 rounded-[32px] p-10 group/card">
              <div className="absolute inset-0 bg-radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.05),transparent_70%) opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#111111] border border-white/10 flex items-center justify-center mb-8 shadow-inner shadow-white/5 group-hover/card:border-violet-500/50 transition-colors">
                    <Spline size={24} className="text-violet-400" />
                  </div>
                  <h3 className="text-2xl font-medium mb-4 text-white">Agentic Watchdog</h3>
                  <p className="text-[#888] text-[15px] max-w-lg leading-relaxed font-light">
                    Powered by LangGraph, our autonomous agent executes a 7-step evaluation pipeline, ensuring comprehensive quality assessment with zero human intervention.
                  </p>
                </div>
                
                {/* Advanced Graph Viz */}
                <div className="relative h-28 mt-10 rounded-2xl border border-white/5 bg-black/40 overflow-hidden flex items-center px-8">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] bg-[size:200%_100%] animate-[bg-pan_4s_linear_infinite]"></div>
                  <div className="w-full flex items-center justify-between text-[#444]">
                    {[0,1,2,3,4,5].map(idx => (
                      <div key={idx} className="flex items-center flex-1">
                        <motion.div 
                          animate={idx === activeNode % 6 ? { 
                            scale: [1, 1.2, 1],
                            borderColor: ["rgba(139,92,246,0.1)", "rgba(139,92,246,0.5)", "rgba(139,92,246,0.1)"]
                          } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className={`w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center bg-black/80 relative z-10
                            ${idx === activeNode % 6 ? 'text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : ''}
                          `}
                        >
                          <div className={`w-2 h-2 rounded-full ${idx === activeNode % 6 ? 'bg-violet-400 animate-pulse' : 'bg-[#333]'}`}></div>
                        </motion.div>
                        {idx < 5 && (
                          <div className="flex-1 h-[1px] bg-linear-to-r from-white/10 to-white/10 relative">
                            {idx === activeNode % 5 && (
                              <motion.div 
                                initial={{ left: "-100%" }}
                                animate={{ left: "100%" }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 bottom-0 w-8 bg-linear-to-r from-transparent via-violet-400/40 to-transparent"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Box 2: Three Key Architecture */}
            <SpotlightCard className="bg-linear-to-b from-[#0C0C0E] to-[#010101] border border-white/5 rounded-[32px] p-10 group/card">
              <div className="absolute inset-0 bg-radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.05),transparent_70%) opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>
              <div className="h-full flex flex-col justify-between relative z-10">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#111111] border border-white/10 flex items-center justify-center mb-8 shadow-inner shadow-white/5 group-hover/card:border-blue-500/50 transition-colors">
                    <Database size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-medium mb-4 text-white">Isolated Inference</h3>
                  <p className="text-[#888] text-[15px] leading-relaxed font-light">
                    Our 3-key Groq architecture separates runner pools from judge models. Zero state bleed. Deterministic scoring at `temperature=0`.
                  </p>
                </div>
                <div className="flex flex-col gap-3 mt-8">
                  {['Key Runner A', 'Key Runner B', 'Consensus Judge'].map((k, i) => (
                    <div key={k} className="flex items-center gap-3 bg-white/5 rounded-xl border border-white/5 p-3 group/item">
                      <div className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-blue-400' : 'bg-white/40'}`}></div>
                      <span className="text-[11px] font-mono text-[#666] group-hover/item:text-[#AAA] transition-colors">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>

            {/* Box 3: Multi-Model Compare */}
            <SpotlightCard className="bg-linear-to-b from-[#0C0C0E] to-[#010101] border border-white/5 rounded-[32px] p-10 group/card">
               <div className="h-full flex flex-col justify-between relative z-10">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#111111] border border-white/10 flex items-center justify-center mb-8 shadow-inner shadow-white/5 group-hover/card:border-white/50 transition-colors">
                    <GitBranch size={24} className="text-white opacity-80" />
                  </div>
                  <h3 className="text-2xl font-medium mb-4 text-white">Model Agnostic</h3>
                  <p className="text-[#888] text-[15px] leading-relaxed font-light">
                    Run the same evaluation suite against Llama-3, GPT-4, and Claude simultaneously. Side-by-side comparison in seconds.
                  </p>
                </div>
                <div className="space-y-4 mt-8">
                  {modelComparison.map((m, i) => (
                    <div key={m.model} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-[#555]">
                        <span>{m.model}</span>
                        <span>{(m.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${m.score * 100}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-linear-to-r from-violet-500/50 to-blue-500/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>

            {/* Box 4: Security Vault */}
            <SpotlightCard className="md:col-span-2 bg-linear-to-b from-[#0C0C0E] to-[#010101] border border-white/5 rounded-[32px] p-10 group/card overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none"></div>
              <div className="flex flex-col md:flex-row gap-12 h-full relative z-10">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#111111] border border-white/10 flex items-center justify-center mb-8 shadow-inner shadow-white/5 group-hover/card:border-emerald-500/50 transition-colors">
                      <Shield size={24} className="text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-medium mb-4 text-white">Audit Ready & Compliant</h3>
                    <p className="text-[#888] text-[15px] leading-relaxed font-light max-w-sm">
                      Veridian maintains a cryptographic audit trail of every test case, designed specifically for DPDP and SOC2 compliance records.
                    </p>
                  </div>
                  <div className="flex gap-4 mt-10">
                    <span className="text-[10px] font-mono border border-white/5 bg-white/5 px-4 py-1.5 rounded-full text-[#666] uppercase tracking-widest">DPDP Compliant</span>
                    <span className="text-[10px] font-mono border border-white/5 bg-white/5 px-4 py-1.5 rounded-full text-[#666] uppercase tracking-widest">SOC 2 Type II</span>
                  </div>
                </div>
                
                {/* 3D-ish Document Stack */}
                <div className="hidden md:flex flex-1 justify-center items-center relative py-10">
                   <div className="absolute inset-0 bg-radial-gradient(circle,rgba(16,185,129,0.05),transparent_70%)"></div>
                   <motion.div 
                     whileHover={{ y: -5, rotate: 5 }}
                     className="w-56 aspect-[3/4] bg-[#0F0F11] border border-white/10 rounded-2xl p-6 shadow-2xl relative z-20"
                   >
                     <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                        </div>
                        <span className="text-[10px] font-mono text-[#555]">AUDIT_LOG_04.24</span>
                     </div>
                     <div className="space-y-3">
                       <div className="h-1.5 w-full bg-white/5 rounded-full opacity-60"></div>
                       <div className="h-1.5 w-4/5 bg-white/5 rounded-full opacity-60"></div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full opacity-60"></div>
                       <div className="h-1.5 w-3/5 bg-white/5 rounded-full opacity-60 mt-6"></div>
                     </div>
                     <motion.div 
                       animate={{ opacity: [0.4, 0.7, 0.4] }}
                       transition={{ duration: 2, repeat: Infinity }}
                       className="absolute bottom-6 right-6 flex items-center gap-1.5"
                     >
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       <span className="text-[9px] font-bold text-emerald-500 tracking-tighter">SECURED</span>
                     </motion.div>
                   </motion.div>
                   <div className="absolute w-56 aspect-[3/4] bg-[#070708] border border-white/10 rounded-2xl -translate-x-6 translate-y-6 rotate-[-4deg] z-10 opacity-50"></div>
                </div>
              </div>
            </SpotlightCard>

          </div>
        </div>
      </section>


      {/* DASHBOARD VISUALIZATION */}
      <section id="dashboard" className="py-24 px-6 relative z-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Granular insights.</h2>
              <p className="text-[#888888] text-lg max-w-xl">Deep dive into specific metrics like hallucination, faithfulness, and answer relevancy. Pinpoint exactly where your model breaks down.</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-sm text-white hover:text-violet-400 transition-colors mt-6 md:mt-0">
               View Live Demo <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-2 md:p-6 shadow-2xl">
            <div className="bg-[#000] border border-white/5 rounded-[24px] p-6 lg:p-10 w-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                <div>
                  <div className="text-xl font-medium mb-1">Quality Over Time</div>
                  <div className="text-sm text-[#666]">Medical Triage Suite v2 • Llama-3.3-70b</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono bg-white/5 px-3 py-1.5 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                    Quality Score
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={qualityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#555', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#555', fontSize: 12 }} 
                      domain={[0, 1]}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                      itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}
                      labelStyle={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}
                    />
                    <ReferenceLine y={0.75} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Mini Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
                {[
                  { label: "Correctness", val: "0.92", change: "+0.02", ok: true },
                  { label: "Faithfulness", val: "0.88", change: "-0.01", ok: true },
                  { label: "Hallucination", val: "0.15", change: "+0.12", ok: false }, // Lower is better technically, but modeled as score here
                  { label: "Relevancy", val: "0.94", change: "+0.01", ok: true }
                ].map((m, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-[#111] rounded-xl p-4 border border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="text-xs text-[#888] uppercase tracking-wider font-mono mb-2">{m.label}</div>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-light">{m.val}</div>
                      <div className={`text-xs font-mono mb-1 ${m.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                        {m.change}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* FOOTER - Minimal, Linear style */}
      <footer className="border-t border-white/10 bg-black pt-16 pb-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/10 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Logo className="w-6 h-6 shrink-0" />
              <span className="font-semibold text-lg tracking-tight">Veridian</span>
            </div>
            <p className="text-[#666] text-sm">The truth layer for enterprise AI.</p>
          </div>
          
          <div className="flex gap-4 sm:gap-8">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-white tracking-wider uppercase mb-1">Product</span>
              <a href="#" className="text-sm text-[#888] hover:text-white transition-colors">Features</a>
              <a href="#" className="text-sm text-[#888] hover:text-white transition-colors">Pricing</a>
              <a href="#" className="text-sm text-[#888] hover:text-white transition-colors">Docs</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-white tracking-wider uppercase mb-1">Company</span>
              <a href="#" className="text-sm text-[#888] hover:text-white transition-colors">About</a>
              <a href="#" className="text-sm text-[#888] hover:text-white transition-colors">Blog</a>
              <a href="#" className="text-sm text-[#888] hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#555]">
          <div>© 2026 Veridian HQ. All rights reserved.</div>
          <div className="flex gap-4">
             <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Global simple keyframes for local component usage */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bg-pan {
          from { background-position: 0% center; }
          to { background-position: -200% center; }
        }
      `}} />
    </div>
  );
}
