"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Server } from "lucide-react";
import { SpotlightCard } from "./spotlight-card";

export const LandingSecurity = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="py-24 relative overflow-hidden bg-slate-900/50 dark:bg-black/80">
      {/* Immersive glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-6">
            <ShieldCheck size={16} />
            Enterprise-Grade Security
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Your financial data, <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              airtight.
            </span>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {/* Security Card 1 */}
          <SpotlightCard
            variants={itemVariants}
            className="p-8 rounded-[2rem] bg-slate-800/40 backdrop-blur-xl border border-white/10 text-center flex flex-col items-center group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 shadow-inner flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-500">
              <Server size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Local LLM Privacy</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              We use <strong className="text-emerald-300 font-bold">Ollama (Llama 3)</strong> running natively. Your sensitive statements are processed in-house and never sent to OpenAI or third-party APIs.
            </p>
          </SpotlightCard>

          {/* Security Card 2 */}
          <SpotlightCard
            variants={itemVariants}
            className="p-8 rounded-[2rem] bg-slate-800/40 backdrop-blur-xl border border-white/10 text-center flex flex-col items-center group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 shadow-inner flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-500">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Arcjet Protection</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              Every request is shielded by Arcjet. We enforce strict rate limits, prevent bot abuse, and sanitize all data streams instantly.
            </p>
          </SpotlightCard>

          {/* Security Card 3 */}
          <SpotlightCard
            variants={itemVariants}
            className="p-8 rounded-[2rem] bg-slate-800/40 backdrop-blur-xl border border-white/10 text-center flex flex-col items-center group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 shadow-inner flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-500">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Bank-Grade Encryption</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              Your uploaded PDFs and CSVs are parsed securely in memory and discarded. Your database records are fully encrypted at rest.
            </p>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
};
