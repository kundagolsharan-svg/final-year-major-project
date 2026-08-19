"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { DemoModal } from "@/components/demo-modal";

const HeroSection = () => {
  const imageRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);
  const imageRotateX = useTransform(scrollYProgress, [0, 0.5], [12, 0]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-16 px-4 overflow-hidden bg-white dark:bg-black transition-colors duration-500">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 animate-gradient bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#ffffff] dark:from-black dark:via-[#050510] dark:to-black"
          style={{
            backgroundSize: "400% 400%",
          }}
        />
        {/* Floating orbs - Adapts to dark mode for neon pop */}
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-40 dark:opacity-30 float"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-30 dark:opacity-25 float"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)",
            filter: "blur(80px)",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 w-96 h-96 rounded-full opacity-25 dark:opacity-20 float"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.5) 0%, transparent 70%)",
            filter: "blur(80px)",
            animationDelay: "0.8s",
          }}
        />
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-900/50 bg-white/80 dark:bg-black/50 backdrop-blur-md shadow-sm text-sm font-medium text-indigo-700 dark:text-indigo-300"
      >
        <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" />
        AI-Powered Financial Intelligence
        <span className="ml-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-full text-xs font-bold">
          BETA
        </span>
      </motion.div>

      {/* Headline */}
      <div className="text-center max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] pb-4"
        >
          <motion.span 
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage: "linear-gradient(to right, #6366f1, #a855f7, #ec4899, #f43f5e, #6366f1)",
              backgroundSize: "200% auto",
            }}
            className="text-transparent bg-clip-text pr-2 drop-shadow-sm"
          >
            Your AI
          </motion.span>
          <br />
          <span className="text-slate-900 dark:text-white">Financial Advisor</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="mt-6 text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Smartly manage your expenses, track bills, and plan savings with 
          the intelligence of SAMPAT. Get personalized insights that matter.
        </motion.p>
      </div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        className="mt-10 flex flex-col sm:flex-row items-center gap-4"
      >
        <Link href="/dashboard">
          <Button
            size="lg"
            className="px-8 h-14 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/20 hover:scale-[1.03] transition-all duration-200 flex items-center gap-2 border border-transparent dark:border-indigo-500/30"
          >
            Get Started Free
            <ArrowRight size={18} />
          </Button>
        </Link>
        <DemoModal />
      </motion.div>

      {/* Social proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="mt-10 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium"
      >
        <TrendingUp size={16} className="text-emerald-500" />
        <span>Join thousands of users managing smarter finances</span>
      </motion.div>

      {/* Dashboard Preview */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        className="hero-image-wrapper mt-16 w-full max-w-5xl mx-auto"
      >
        <motion.div
          ref={imageRef}
          style={{ rotateX: imageRotateX, y: imageY }}
          className="hero-image rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-[0_40px_100px_rgba(99,102,241,0.2)] dark:shadow-[0_40px_100px_rgba(99,102,241,0.15)] relative"
        >
          {/* Subtle reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent dark:from-white/5 z-10 pointer-events-none" />
          <Image
            src="/hero-banner.jpg"
            width={1280}
            height={720}
            alt="SAMPAT AI Financial Advisor"
            className="w-full h-auto object-cover"
            priority
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
