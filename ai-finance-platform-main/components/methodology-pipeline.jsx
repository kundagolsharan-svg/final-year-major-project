"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Settings,
  BrainCircuit,
  Database,
  BarChart3,
  Bot,
  Target,
  FileBarChart,
  Infinity as InfinityIcon,
  Zap,
  ShieldCheck,
  Server
} from "lucide-react";
import { SpotlightCard } from "@/components/spotlight-card";

const pipelineStages = [
  {
    id: "01",
    title: "DATA COLLECTION",
    icon: <FileText className="w-8 h-8 text-blue-400" />,
    items: ["PDF Statements", "CSV Files", "Simulated Bank Integration"],
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    id: "02",
    title: "DATA PROCESSING",
    icon: <Settings className="w-8 h-8 text-indigo-400" />,
    items: ["Parsing", "Data Cleaning", "Validation", "Deduplication", "Merchant Normalization"],
    color: "from-indigo-500/20 to-blue-500/20",
    borderColor: "border-indigo-500/30",
  },
  {
    id: "03",
    title: "AI CATEGORIZATION",
    icon: <BrainCircuit className="w-8 h-8 text-purple-400" />,
    items: ["Merchant Detection", "Ollama + Llama 3", "Category Assignment", "Merchant Category Cache"],
    color: "from-purple-500/20 to-indigo-500/20",
    borderColor: "border-purple-500/30",
    badge: "Llama 3",
  },
  {
    id: "04",
    title: "DATA STORAGE",
    icon: <Database className="w-8 h-8 text-emerald-400" />,
    items: ["Prisma ORM", "Supabase", "PostgreSQL", "Secure & Scalable"],
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
  },
  {
    id: "05",
    title: "ANALYTICS & INSIGHTS",
    icon: <BarChart3 className="w-8 h-8 text-amber-400" />,
    items: ["Category-wise Analysis", "Pie & Bar Charts", "Spending Patterns", "Financial Insights"],
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    id: "06",
    title: "AI ASSISTANCE & FORECAST",
    icon: <Bot className="w-8 h-8 text-pink-400" />,
    items: ["AI Financial Assistant (Chat)", "Explainable AI", "Spending Forecast", "Recommendations"],
    color: "from-pink-500/20 to-rose-500/20",
    borderColor: "border-pink-500/30",
  },
  {
    id: "07",
    title: "BUDGET, GOALS & ALERTS",
    icon: <Target className="w-8 h-8 text-red-400" />,
    items: ["Budget Tracking", "Goal Tracking", "Anomaly Alerts", "Duplicate Alerts", "Financial Health"],
    color: "from-red-500/20 to-orange-500/20",
    borderColor: "border-red-500/30",
  },
  {
    id: "08",
    title: "REPORTS & VISUALIZATION",
    icon: <FileBarChart className="w-8 h-8 text-cyan-400" />,
    items: ["Monthly Financial Report (PDF)", "Light / Dark Mode", "Responsive UI", "SAMPAT Dashboard"],
    color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30",
  },
];

export const MethodologyPipeline = () => {
  // Container animation for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.8,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, rotateX: -15 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 1.5, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  return (
    <section className="py-24 relative overflow-hidden bg-slate-900 dark:bg-[#030308] border-y border-white/5">
      {/* Immersive Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[800px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[500px] bg-purple-500/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
            METHODOLOGY
          </h2>
          <p className="text-xl md:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
            SAMPAT – Smart AI Based Money Planning and Analytics Tool
          </p>
        </motion.div>

        {/* The 8-Stage Pipeline Grid */}
        <div className="relative">
          {/* Animated SVG Connector Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-[120px] left-0 right-0 h-1 z-0">
            <svg width="100%" height="20" className="overflow-visible">
              <motion.line
                x1="5%"
                y1="10"
                x2="95%"
                y2="10"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
                strokeDasharray="8 8"
              />
              <motion.line
                x1="5%"
                y1="10"
                x2="95%"
                y2="10"
                stroke="url(#gradient-line)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 1000", strokeDashoffset: 0 }}
                whileInView={{ strokeDasharray: "1000 1000", strokeDashoffset: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 6, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 relative z-10"
            style={{ perspective: "1000px" }}
          >
            {pipelineStages.map((stage) => (
              <SpotlightCard
                key={stage.id}
                variants={itemVariants}
                whileHover={{ y: -10, rotateX: 5, rotateY: -5, scale: 1.02 }}
                className={`relative bg-slate-800/40 backdrop-blur-xl border ${stage.borderColor} p-6 rounded-3xl flex flex-col items-center text-center shadow-2xl overflow-hidden group`}
              >
                {/* Stage Glow Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stage.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                
                {/* Step Badge */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-lg font-black text-white shadow-lg mb-6 relative z-10">
                  {stage.id}
                </div>

                <h3 className="text-sm font-bold text-slate-300 tracking-wider mb-6 relative z-10">
                  {stage.title}
                </h3>

                <div className="w-20 h-20 rounded-2xl bg-slate-900/50 border border-white/5 flex items-center justify-center shadow-inner mb-8 group-hover:scale-110 transition-transform duration-500 relative z-10">
                  {stage.icon}
                  {stage.badge && (
                    <div className="absolute -bottom-3 px-3 py-1 bg-indigo-600 text-xs font-bold text-white rounded-full whitespace-nowrap shadow-md">
                      {stage.badge}
                    </div>
                  )}
                </div>

                <ul className="space-y-3 w-full relative z-10">
                  {stage.items.map((item, idx) => (
                    <li key={idx} className="flex items-start text-left text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 mr-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            ))}
          </motion.div>
        </div>

        {/* Bottom Architecture Blocks */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 6.5 }}
          className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* AI Engine Block */}
          <div className="relative p-8 rounded-[2rem] bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 backdrop-blur-lg flex flex-col md:flex-row items-center gap-8 shadow-[0_0_50px_rgba(99,102,241,0.1)] group hover:border-indigo-500/40 transition-colors">
            <div className="absolute -top-3 left-8 px-4 py-1 bg-indigo-600 rounded-full text-xs font-black tracking-widest text-white shadow-lg">
              AI ENGINE
            </div>
            
            <div className="flex flex-1 items-center justify-center gap-4 w-full">
              <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shadow-md">
                  <Server className="w-8 h-8 text-indigo-400" />
                </div>
                <span className="text-sm font-bold text-slate-300">OLLAMA</span>
              </div>
              
              <div className="flex items-center text-indigo-500">
                <InfinityIcon className="w-8 h-8 animate-pulse" />
              </div>
              
              <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                  <BrainCircuit className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-bold text-white text-center">LLAMA 3 <br/><span className="text-[10px] text-indigo-200 font-medium">(LOCAL LLM)</span></span>
              </div>
            </div>

            <div className="w-full md:w-auto p-4 rounded-xl bg-slate-900/60 border border-white/5 border-l-4 border-l-indigo-500">
              <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Financial Intelligence</h4>
              <ul className="text-xs text-slate-400 space-y-1 font-medium">
                <li>• Natural Language Understanding</li>
                <li>• Contextual Financial Analysis</li>
                <li>• Intelligent Responses</li>
              </ul>
            </div>
          </div>

          {/* Supporting Services Block */}
          <div className="relative p-8 rounded-[2rem] bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 backdrop-blur-lg flex flex-col md:flex-row items-center justify-around gap-6 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
            <div className="absolute -top-3 left-8 px-4 py-1 bg-emerald-600 rounded-full text-xs font-black tracking-widest text-white shadow-lg">
              SUPPORTING SERVICES
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 w-full hover:bg-slate-800/60 transition-colors border border-transparent hover:border-emerald-500/20">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">INNGEST</h4>
                <p className="text-xs text-slate-400 font-medium">Background Jobs & Batch AI</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 w-full hover:bg-slate-800/60 transition-colors border border-transparent hover:border-teal-500/20">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">ARCJET</h4>
                <p className="text-xs text-slate-400 font-medium">App Security & Rate Limiting</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Outcome Footer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 7.5 }}
          className="mt-16 mx-auto max-w-4xl p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 backdrop-blur-md flex flex-col md:flex-row items-center gap-6 justify-center text-center md:text-left shadow-2xl"
        >
          <div className="px-6 py-2 bg-indigo-600 text-white font-black tracking-widest rounded-full text-sm shadow-[0_0_15px_rgba(79,70,229,0.5)] flex-shrink-0">
            OUTCOME
          </div>
          <p className="text-slate-300 font-medium text-lg leading-relaxed">
            Raw financial data is transformed into meaningful insights, intelligent assistance, predictions, and actionable financial planning.
          </p>
        </motion.div>

      </div>
    </section>
  );
};
