"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  featuresData,
  howItWorksData,
  statsData,
} from "@/data/landing";
import HeroSection from "@/components/hero";
import Link from "next/link";
import { Star, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/spotlight-card";

const LandingPage = () => {
  // Stagger variants for grid items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030308] transition-colors duration-500 overflow-hidden selection:bg-indigo-500/30">
      
      {/* Hero */}
      <HeroSection />

      {/* Stats - Floating Glassmorphic Cards */}
      <section className="py-20 relative z-10 border-t border-slate-200/50 dark:border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/50 dark:to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {statsData.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="relative p-8 text-center group rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-colors duration-500" />
                
                <div className="relative z-10 text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 drop-shadow-sm">
                  {stat.value}
                </div>
                <div className="relative z-10 text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features - Immersive 3D Cards */}
      <section id="features" className="py-32 relative">
        {/* Floating background orbs for Features */}
        <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-40 right-0 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-20"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-300 text-sm font-bold tracking-wide shadow-sm backdrop-blur-md mb-6">
              <CheckCircle size={14} className="text-indigo-500" />
              Complete Toolkit
            </span>
            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Intelligence for your <br />
              <motion.span 
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage: "linear-gradient(to right, #6366f1, #a855f7, #ec4899, #f43f5e, #6366f1)",
                  backgroundSize: "200% auto",
                }}
                className="text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >financial future</motion.span>
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featuresData.map((feature, index) => (
              <SpotlightCard
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative p-[1px] rounded-[2rem] bg-gradient-to-br from-slate-200 to-slate-100 dark:from-white/10 dark:via-white/5 dark:to-transparent shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.3)] group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[2rem] blur-xl" />
                <div className="relative h-full p-8 rounded-[2rem] bg-white/80 dark:bg-[#08080f]/90 backdrop-blur-xl overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-white/10 dark:to-white/5 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium relative z-10">
                    {feature.description}
                  </p>
                </div>
              </SpotlightCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works - Glowing Connectors */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-200/50 dark:bg-black/50 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] -z-10" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ready in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">three steps</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
            {/* Animated Connector line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-slate-200 dark:bg-white/10 z-0">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-1/3"
                animate={{ left: ["-33%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            {howItWorksData.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: index * 0.2, ease: "easeOut" }}
                className="text-center relative z-10 group"
              >
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                  />
                  <div className="w-20 h-20 bg-white dark:bg-[#0a0a14] rounded-full flex items-center justify-center shadow-lg border border-slate-200 dark:border-white/10 relative z-10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-500">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-sm font-black rounded-full flex items-center justify-center z-20 shadow-md border-2 border-white dark:border-[#0a0a14]">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA - The Final 3D Pop */}
      <section className="py-32 relative overflow-hidden">
        {/* Deep immersive background */}
        <div className="absolute inset-0 z-0 bg-black" />
        <div
          className="absolute inset-0 z-0 animate-gradient bg-gradient-to-br from-indigo-900 via-[#050510] to-purple-900 opacity-80"
          style={{ backgroundSize: "200% 200%" }}
        />
        
        {/* Grid pattern over CTA */}
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            transform: "rotateX(60deg) scale(2)",
            transformOrigin: "bottom",
            perspective: "1000px"
          }}
        />

        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="p-12 md:p-20 rounded-[3rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.2)] max-w-4xl mx-auto"
          >
            <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-xl">
              Take <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">control.</span>
            </h2>
            <p className="text-xl text-indigo-100/80 mb-10 max-w-xl mx-auto font-medium">
              Join the future of personal finance. No credit card required.
            </p>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="px-12 h-16 text-lg font-bold bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 mx-auto"
              >
                Start for Free
                <ArrowRight size={22} className="text-indigo-600" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-[#030308] relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm shadow-lg">
              S
            </span>
            SAMPAT Finance
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} SAMPAT Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
