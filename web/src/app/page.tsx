"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, Activity, Shield, FileText, BarChart3, Bot, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { LineChart, Line, ReferenceLine, Dot, ResponsiveContainer } from "recharts";
import { useState } from "react";

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
    { time: "20:00", score: 0.72 }, // Regression point
    { time: "24:00", score: 0.78 },
  ];

  const modelComparison = [
    { model: "llama3-70b", score: 0.88 },
    { model: "gpt-4o", score: 0.91 },
    { model: "claude-3.5", score: 0.85 },
  ];

  const agentNodes = [
    "trigger_received",
    "load_eval_suite", 
    "run_model",
    "score_results",
    "compare_baseline",
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
    
    // Animate pipeline flow
    const flowInterval = setInterval(() => {
      setPipelineFlow(prev => {
        if (prev >= 4) {
          clearInterval(flowInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    
    // Animate through agent nodes
    const nodeInterval = setInterval(() => {
      setActiveNode(prev => {
        if (prev >= agentNodes.length - 1) {
          clearInterval(nodeInterval);
          // Trigger regression after all nodes
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

  return (
    <div className="bg-[#020203] min-h-screen">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#020203]/80 backdrop-blur-md border-b border-[#1A1A1E] max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="font-bold text-[20px] text-[#FAFAFA]">
            Veridian
          </div>
          
          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-8 font-medium text-[14px] text-[#71717A]">
            <span className="hover:text-[#A1A1AA] transition cursor-pointer">Product</span>
            <span className="hover:text-[#A1A1AA] transition cursor-pointer">Agent</span>
            <span className="hover:text-[#A1A1AA] transition cursor-pointer">Pricing</span>
            <span className="hover:text-[#A1A1AA] transition cursor-pointer">Docs</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button className="border border-[#27272A] text-[#A1A1AA] rounded-lg px-4 py-2 font-medium text-[14px] hover:border-[#3F3F46] transition bg-transparent">
              Sign In
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-lg px-4 py-2 font-medium text-[14px] transition-all hover:shadow-lg"
            >
              Start Free Trial →
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT SIDE - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="z-10"
          >
            {/* Headline */}
            <motion.h1 
              className="font-bold text-[#FAFAFA] mb-8" 
              style={{ fontSize: 'clamp(52px, 6vw, 72px)', lineHeight: 1.05 }}
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
                AI failures
              </motion.span>
              <br />
              before your users do.
            </motion.h1>

            {/* Subtext */}
            <motion.p 
              className="text-[#A1A1AA] text-xl leading-relaxed mb-10 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Veridian continuously evaluates your models, detects regressions, and alerts you before quality drops in production.
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
                Start Evaluating →
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, borderColor: "#3F3F46", backgroundColor: "rgba(63, 63, 70, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="border border-[#27272A] bg-transparent text-[#A1A1AA] px-8 py-4 text-base font-medium rounded-xl transition-all duration-300"
              >
                View Demo
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
                { icon: Shield, text: "DPDP ready", color: "text-blue-400" }
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

          {/* RIGHT SIDE - INSANE REAL-TIME SYSTEM VISUALIZATION */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="relative z-10"
          >
            {/* Pipeline System */}
            <div className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-3xl p-10 relative overflow-hidden">
              {/* Animated Background Grid */}
              <div className="absolute inset-0 opacity-20">
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                  }}
                />
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

                {/* Connecting Lines with Flow */}
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
                  
                  {/* Flowing Particles */}
                  {isSimulating && Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 w-2 h-2 bg-violet-400 rounded-full"
                      style={{ transform: 'translateY(-50%)' }}
                      animate={{
                        left: ['8%', '92%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.7
                      }}
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
                      animate={regressionDetected ? {
                        scale: [1, 1.1, 1],
                      } : {}}
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

            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 bg-linear-to-r from-violet-600/20 to-blue-600/20 rounded-3xl blur-xl -z-10"
              animate={alertActive ? {
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              } : {}}
              transition={{ duration: 2, repeat: alertActive ? Infinity : 0 }}
            />
          </motion.div>
        </div>
      </section>

      {/* AGENT SECTION */}
      <section className="py-24 px-6 bg-[#0A0A0B]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-bold text-[#FAFAFA] text-4xl mb-4">
              Your AI now has a watchdog.
            </h2>
            <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto">
              Autonomous agents monitor your models 24/7, catching regressions before they impact your users.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Explanation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-[#FAFAFA] text-3xl mb-6">
                LangGraph-Powered Pipeline
              </h3>
              <p className="text-[#A1A1AA] text-lg mb-8 leading-relaxed">
                Our autonomous agent executes a 7-step evaluation pipeline, ensuring comprehensive quality assessment with zero human intervention.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: CheckCircle, text: "Continuous monitoring", color: "text-green-400" },
                  { icon: Activity, text: "Real-time scoring", color: "text-violet-400" },
                  { icon: AlertTriangle, text: "Instant regression alerts", color: "text-red-400" },
                  { icon: Shield, text: "Full audit trail", color: "text-blue-400" }
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

            {/* Right - Agent Graph Visualization */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#020203] border border-[#1A1A1E] rounded-3xl p-10 relative overflow-hidden"
            >
              {/* Graph Background */}
              <div className="absolute inset-0 opacity-10">
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.1) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                  }}
                />
              </div>

              {/* Node Graph */}
              <div className="relative z-10">
                {/* Graph Nodes */}
                <div className="relative h-96">
                  {agentNodes.map((node, index) => {
                    // Calculate positions for a flowing graph layout
                    const positions = [
                      { x: 50, y: 10 },   // trigger_received
                      { x: 20, y: 30 },   // load_eval_suite  
                      { x: 80, y: 30 },   // run_model
                      { x: 50, y: 50 },   // score_results
                      { x: 20, y: 70 },   // compare_baseline
                      { x: 80, y: 70 },   // generate_report
                      { x: 50, y: 90 }    // notify
                    ];
                    const pos = positions[index];
                    
                    return (
                      <motion.div key={node}>
                        {/* Node */}
                        <motion.div
                          className="absolute w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer"
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            borderColor: index < activeNode ? '#22C55E' : 
                                         index === activeNode ? '#8B5CF6' : 
                                         '#27272A',
                            backgroundColor: index < activeNode ? 'rgba(34,197,94,0.1)' : 
                                              index === activeNode ? 'rgba(139,92,246,0.1)' : 
                                              'rgba(26,26,26,0.5)',
                            boxShadow: index === activeNode ? '0 0 30px rgba(139,92,246,0.5)' : 
                                        index < activeNode ? '0 0 20px rgba(34,197,94,0.3)' : 'none'
                          }}
                          whileHover={{ scale: 1.1 }}
                          animate={index === activeNode ? {
                            scale: [1, 1.05, 1],
                            opacity: [1, 0.8, 1]
                          } : {}}
                          transition={{ duration: 1, repeat: index === activeNode ? Infinity : 0 }}
                        >
                          <div className="text-xs font-mono text-[#52525B] mb-1">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <div className={`text-xs font-mono text-center px-1 ${
                            index < activeNode ? 'text-green-400' : 
                            index === activeNode ? 'text-violet-400' : 
                            'text-[#52525B]'
                          }`}>
                            {node.replace('_', ' ').replace(' ', '\n')}
                          </div>
                        </motion.div>

                        {/* Status Icon */}
                        {index < activeNode && (
                          <motion.div
                            className="absolute w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                            style={{
                              left: `${pos.x + 35}%`,
                              top: `${pos.y - 25}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <CheckCircle size={16} className="text-white" />
                          </motion.div>
                        )}
                        
                        {index === activeNode && (
                          <motion.div
                            className="absolute w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center"
                            style={{
                              left: `${pos.x + 35}%`,
                              top: `${pos.y - 25}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Activity size={16} className="text-white animate-pulse" />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Draw connections between nodes */}
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                    
                    {/* Connection paths */}
                    {[
                      { from: 0, to: 1 }, // trigger_received -> load_eval_suite
                      { from: 0, to: 2 }, // trigger_received -> run_model  
                      { from: 1, to: 3 }, // load_eval_suite -> score_results
                      { from: 2, to: 3 }, // run_model -> score_results
                      { from: 3, to: 4 }, // score_results -> compare_baseline
                      { from: 3, to: 5 }, // score_results -> generate_report
                      { from: 4, to: 6 }, // compare_baseline -> notify
                      { from: 5, to: 6 }  // generate_report -> notify
                    ].map((conn, index) => {
                      const positions = [
                        { x: 50, y: 10 }, { x: 20, y: 30 }, { x: 80, y: 30 },
                        { x: 50, y: 50 }, { x: 20, y: 70 }, { x: 80, y: 70 }, { x: 50, y: 90 }
                      ];
                      const from = positions[conn.from];
                      const to = positions[conn.to];
                      const isActive = activeNode > conn.from && activeNode > conn.to;
                      
                      return (
                        <motion.line
                          key={index}
                          x1={`${from.x}%`}
                          y1={`${from.y}%`}
                          x2={`${to.x}%`}
                          y2={`${to.y}%`}
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

                {/* Regression Alert */}
                <AnimatePresence>
                  {regressionDetected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-4 left-4 right-4 bg-red-950/40 border border-red-900 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-center gap-3 text-red-400 font-mono">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: 2 }}
                        >
                          <AlertTriangle size={24} />
                        </motion.div>
                        <span className="text-base font-semibold">REGRESSION DETECTED</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DASHBOARD SECTION */}
      <section className="py-24 px-6 bg-[#0A0A0B]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-bold text-[#FAFAFA] text-5xl mb-6">
              Track quality over time
            </h2>
            <p className="text-[#A1A1AA] text-xl max-w-2xl mx-auto">
              Get insights into your model performance with comprehensive dashboards and detailed analytics.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Quality Trends */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.8 }}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 0 40px rgba(139,92,246,0.2)",
                borderColor: "#8B5CF6"
              }}
              className="bg-[#020203] border border-[#1A1A1E] rounded-3xl p-8 transition-all duration-300"
            >
              <h3 className="font-semibold text-[#FAFAFA] text-xl mb-6">Quality Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qualityData}>
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8B5CF6" 
                      strokeWidth={3}
                      dot={false}
                      animationDuration={2000}
                    />
                    <ReferenceLine 
                      y={0.75} 
                      stroke="#F59E0B" 
                      strokeDasharray="8 4" 
                      strokeWidth={2}
                    />
                    <Dot 
                      cx={120} 
                      cy={72} 
                      r={6} 
                      fill="#EF4444"
                      stroke="#fff"
                      strokeWidth={2}
                    />
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
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 0 40px rgba(139,92,246,0.2)",
                borderColor: "#8B5CF6"
              }}
              className="bg-[#020203] border border-[#1A1A1E] rounded-3xl p-8 transition-all duration-300"
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
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 0 40px rgba(139,92,246,0.2)",
                borderColor: "#8B5CF6"
              }}
              className="bg-[#020203] border border-[#1A1A1E] rounded-3xl p-8 transition-all duration-300"
            >
              <h3 className="font-semibold text-[#FAFAFA] text-xl mb-6">Metric Breakdown</h3>
              <div className="space-y-4">
                {[
                  { metric: "hallucination", score: 0.15, color: "bg-red-500", label: "Critical Issue" },
                  { metric: "correctness", score: 0.88, color: "bg-green-500", label: "Excellent" },
                  { metric: "faithfulness", score: 0.92, color: "bg-green-500", label: "Excellent" }
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
                        <span className={`text-xs px-2 py-1 rounded ${
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

          {/* WHY THIS MATTERS SECTION */}
      <section className="py-24 px-6">
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
              {/* Red Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-red-500/10 rounded-3xl blur-xl"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <X size={24} className="text-red-400" />
                      </motion.div>
                      <span className="text-[#A1A1AA] text-lg">{item}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Risk Badge */}
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
              {/* Green Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-green-500/10 rounded-3xl blur-xl"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <div className="relative bg-green-950/20 border border-green-900/40 rounded-3xl p-10">
                <h3 className="font-semibold text-green-400 text-2xl mb-8">With Veridian</h3>
                <div className="space-y-6">
                  {[
                    "Continuous evaluation",
                    "Instant regression alerts",
                    "Proactive quality monitoring", 
                    "Automated audit trails",
                    "Compliance ready"
                  ].map((item, index) => (
                    <motion.div 
                      key={item}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                      >
                        <CheckCircle size={24} className="text-green-400" />
                      </motion.div>
                      <span className="text-[#A1A1AA] text-lg">{item}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Success Badge */}
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

      {/* COMPLIANCE SECTION */}
      <section className="py-24 px-6 bg-[#0A0A0B]">
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
              Complete traceability and explainability for every evaluation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - PDF Preview with Scan Line */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Document Container */}
              <div className="bg-[#020203] border border-[#1A1A1E] rounded-3xl p-10 relative overflow-hidden">
                {/* Scan Line Animation */}
                <motion.div
                  className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-violet-400 to-transparent"
                  animate={{ y: [0, 400, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ filter: 'blur(1px)' }}
                />
                
                {/* Document Content */}
                <div className="relative z-10">
                  <div className="bg-[#0A0A0B] border border-[#1A1A1E] rounded-2xl p-8 relative">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="h-3 bg-[#1A1A1E] rounded w-4/5"></div>
                        <div className="h-3 bg-[#1A1A1E] rounded w-full"></div>
                        <div className="h-3 bg-[#1A1A1E] rounded w-3/4"></div>
                        <div className="h-3 bg-[#1A1A1E] rounded w-full"></div>
                        <div className="h-3 bg-[#1A1A1E] rounded w-2/3"></div>
                        <div className="h-3 bg-[#1A1A1E] rounded w-full"></div>
                        <div className="h-3 bg-[#1A1A1E] rounded w-1/2"></div>
                      </div>
                  
                    {/* Audit Report Badge */}
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
                  
                  {/* Report Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 p-6 bg-violet-950/20 border border-violet-900 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 text-violet-400 font-mono text-base mb-3">
                      <FileText size={20} />
                      <span>AUDIT REPORT</span>
                    </div>
                    <div className="text-[#A1A1AA] text-sm space-y-1">
                      <div>Generated on 22 Mar 2026</div>
                      <div>42 test cases evaluated</div>
                      <div>Full metric breakdown included</div>
                      <div>DPDP compliant format</div>
                    </div>
                  </motion.div>
                </div>
            </div>
            </div>
            
            {/* Generate Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139,92,246,0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg"
              >
                Generate PDF Report →
              </motion.button>
            </motion.div>
          </motion.div>
          </div>

          {/* Right - Enterprise Features */}
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
                {
                  icon: Shield,
                  title: "Traceability",
                  description: "Every evaluation is logged with timestamps, model versions, and test case details.",
                  delay: 0.1
                },
                {
                  icon: BarChart3,
                  title: "Metric Reasoning", 
                  description: "Detailed explanations for each score with judge reasoning and evidence.",
                  delay: 0.2
                },
                {
                  icon: FileText,
                  title: "Explainability",
                  description: "Full audit trail from input to output with intermediate steps documented.",
                  delay: 0.3
                }
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

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex flex-wrap gap-4"
            >
              {[
                "ISO 27001 Compliant",
                "SOC 2 Type II", 
                "GDPR Ready",
                "DPDP Compliant"
              ].map((cert, index) => (
                <motion.div
                  key={cert}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-[#020203] border border-[#1A1A1E] px-4 py-2 rounded-full font-mono text-sm text-[#71717A]"
                >
                  {cert}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-32 px-6 bg-linear-to-b from-[#0A0A0B] to-[#020203] text-center relative overflow-hidden">
        {/* Background Glow */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{
            background: [
              "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.2) 0%, transparent 60%)",
              "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.1) 0%, transparent 50%)"
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
            style={{
              textShadow: "0 0 60px rgba(139,92,246,0.3)"
            }}
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
            Every model update is a risk. Veridian catches regressions before your users do.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <motion.button 
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 0 40px rgba(139,92,246,0.6)",
                border: "1px solid rgba(139,92,246,0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-10 py-5 text-xl font-bold rounded-2xl transition-all duration-300 shadow-xl border border-transparent"
            >
              Start Free Trial →
            </motion.button>
            <motion.button 
              whileHover={{ 
                scale: 1.05, 
                borderColor: "#8B5CF6",
                backgroundColor: "rgba(139,92,246,0.1)",
                boxShadow: "0 0 30px rgba(139,92,246,0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              className="border border-[#27272A] bg-transparent text-[#A1A1AA] px-10 py-5 text-xl font-medium rounded-2xl transition-all duration-300"
            >
              Schedule Demo
            </motion.button>
          </motion.div>
          
          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16 flex flex-wrap justify-center gap-8"
          >
            {[
              "14-day free trial",
              "No credit card required", 
              "Enterprise security",
              "24/7 support"
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-[#71717A] text-sm font-mono"
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1A1A1E] py-12 px-6 bg-[#020203]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-bold text-[#FAFAFA] text-xl mb-4">Veridian</div>
              <p className="text-[#71717A] text-sm">
                The truth layer for enterprise AI. Continuous evaluation for continuous confidence.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#FAFAFA] mb-4">Product</h4>
              <div className="space-y-2">
                <div className="text-[#71717A] text-sm hover:text-[#A1A1AA] cursor-pointer transition">Features</div>
                <div className="text-[#71717A] text-sm hover:text-[#A1A1AA] cursor-pointer transition">Agent</div>
                <div className="text-[#71717A] text-sm hover:text-[#A1A1AA] cursor-pointer transition">Pricing</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#FAFAFA] mb-4">Company</h4>
              <div className="space-y-2">
                <div className="text-[#71717A] text-sm hover:text-[#A1A1AA] cursor-pointer transition">About</div>
                <div className="text-[#71717A] text-sm hover:text-[#A1A1AA] cursor-pointer transition">Blog</div>
                <div className="text-[#71717A] text-sm hover:text-[#A1A1AA] cursor-pointer transition">Careers</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#FAFAFA] mb-4">Legal</h4>
              <div className="space-y-2">
                <div className="text-[#71717A] text-sm hover:text-[#A1A1AA] cursor-pointer transition">Privacy</div>
                <div className="text-[#71717A] text-sm hover:text-[#A1A1AA] cursor-pointer transition">Terms</div>
                <div className="text-[#71717A] text-sm hover:text-[#A1A1AA] cursor-pointer transition">Security</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#1A1A1E] pt-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-[#52525B] text-sm mb-4 sm:mb-0">
              © 2026 LunaticBytes · TechnoTarang 2026
            </div>
            <div className="flex gap-6 text-sm text-[#52525B]">
              <span>Version 0.1.0</span>
              <span>•</span>
              <span>Built with Next.js 15</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
