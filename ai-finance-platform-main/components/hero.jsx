"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { DemoModal } from "@/components/demo-modal";
import { RobotMascot } from "@/components/robot-mascot";
import { ParticleNetwork } from "@/components/particle-network";

const HeroSection = () => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll animations for the dashboard image
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });

  const scrollImageY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  // Mouse tracking 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const mouseXSpring = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const mouseYSpring = useSpring(mouseY, { stiffness: 60, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);
  const imageRotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-5deg"]);
  const imageRotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Relative position (-0.5 to 0.5)
    const xPct = (e.clientX - rect.left) / width - 0.5;
    const yPct = (e.clientY - rect.top) / height - 0.5;
    
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };



  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-16 px-4 overflow-hidden bg-slate-50 dark:bg-[#030308] transition-colors duration-500 [perspective:1500px]"
    >
      {/* ── 1. Animated Grid Floor ── */}
      <div className="absolute inset-0 z-0 flex items-end justify-center pointer-events-none [perspective:1200px] overflow-hidden">
        <motion.div
          animate={{ backgroundPosition: ["0px 0px", "0px 80px"] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="w-[300vw] h-[150vh] absolute bottom-[-50vh]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            transform: "rotateX(75deg) scale(1)",
            transformOrigin: "bottom",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%)",
            maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
      </div>

      {/* ── 2. Floating 3D Glowing Orbs ── */}
      <motion.div
        animate={{ y: [-30, 30, -30], x: [-20, 20, -20], rotate: [0, 90, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[15%] w-96 h-96 rounded-full z-0 opacity-20 dark:opacity-40 blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)" }}
      />
      <motion.div
        animate={{ y: [30, -30, 30], x: [20, -20, 20], rotate: [0, -90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[20%] right-[10%] w-[30rem] h-[30rem] rounded-full z-0 opacity-15 dark:opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(56,189,248,0.6) 0%, transparent 70%)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full z-0 blur-[120px] dark:opacity-[0.2]"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 60%)" }}
      />

      {/* ── 4. Interactive Particle Network ── */}
      <ParticleNetwork />

      {/* ── Main Content Container with 3D Tilt ── */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative z-20 flex flex-col items-center w-full max-w-5xl mx-auto pointer-events-auto"
      >
        {/* Floating AI Robot Mascot */}
        <RobotMascot />
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ transform: "translateZ(40px)" }}
          className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-lg text-sm font-medium text-indigo-700 dark:text-indigo-300"
        >
          <Sparkles size={14} className="text-indigo-400" />
          AI-Powered Financial Intelligence
          <span className="ml-1 px-2 py-0.5 bg-indigo-900/60 text-indigo-300 rounded-full text-xs font-bold">
            BETA
          </span>
        </motion.div>

        {/* Headline */}
        <div className="text-center w-full" style={{ transform: "translateZ(60px)", transformStyle: "preserve-3d" }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] pb-4 text-slate-900 dark:text-white"
          >
            <motion.span 
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage: "linear-gradient(to right, #6366f1, #a855f7, #ec4899, #f43f5e, #6366f1)",
                backgroundSize: "200% auto",
              }}
              className="text-transparent bg-clip-text pr-2 drop-shadow-[0_0_25px_rgba(99,102,241,0.5)]"
            >
              Your AI
            </motion.span>
            <br />
            <span className="drop-shadow-xl text-slate-900 dark:text-white">Financial Advisor</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            style={{ transform: "translateZ(30px)" }}
            className="mt-6 text-xl text-slate-600 dark:text-indigo-200/80 max-w-2xl mx-auto leading-relaxed font-medium"
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
          style={{ transform: "translateZ(50px)" }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/dashboard">
            <Button
              size="lg"
              className="px-8 h-14 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] dark:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-[1.05] transition-all duration-200 flex items-center gap-2 border border-transparent dark:border-indigo-400/30"
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
          style={{ transform: "translateZ(20px)" }}
          className="mt-10 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium"
        >
          <TrendingUp size={16} className="text-emerald-400" />
          <span>Join thousands of users managing smarter finances</span>
        </motion.div>
      </motion.div>

      {/* ── Dashboard Preview Image with Scroll & 3D Mouse Tilt ── */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        className="relative z-20 hero-image-wrapper mt-16 w-full max-w-5xl mx-auto pointer-events-none"
        style={{ perspective: 1200 }}
      >
        <motion.div
          ref={imageRef}
          style={{ 
            rotateX: imageRotateX, 
            rotateY: imageRotateY, 
            y: scrollImageY,
            transformStyle: "preserve-3d"
          }}
          className="hero-image rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(99,102,241,0.1)] dark:shadow-[0_40px_100px_rgba(99,102,241,0.3)] relative p-2 bg-white/40 dark:bg-white/5 backdrop-blur-3xl"
        >
          {/* Subtle reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent z-10 pointer-events-none rounded-[2rem]" />
          
          <div className="rounded-2xl overflow-hidden relative z-20" style={{ transform: "translateZ(20px)" }}>
            <Image
              src="/hero-banner.jpg"
              width={1280}
              height={720}
              alt="SAMPAT AI Financial Advisor"
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
