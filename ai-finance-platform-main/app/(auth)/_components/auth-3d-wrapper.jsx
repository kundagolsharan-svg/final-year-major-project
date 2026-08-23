"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function Auth3DWrapper({ children }) {
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Smooth springs for a fluid 3D tilt
  const mouseXSpring = useSpring(x, { stiffness: 60, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 60, damping: 25 });

  // Map mouse position to rotation angles (max 15 degrees)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate relative mouse position (-0.5 to +0.5)
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (!isMounted) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050510]">
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030308] [perspective:1500px]"
    >
      {/* ── 1. Animated Grid Floor (Synthwave / 3D Grid style) ── */}
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
        animate={{
          y: [-30, 30, -30],
          x: [-20, 20, -20],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[15%] w-96 h-96 rounded-full z-0 opacity-40 blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)",
        }}
      />
      
      <motion.div
        animate={{
          y: [30, -30, 30],
          x: [20, -20, 20],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[10%] right-[15%] w-[30rem] h-[30rem] rounded-full z-0 opacity-30 blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.6) 0%, transparent 70%)",
        }}
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full z-0 blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 60%)",
        }}
      />

      {/* ── 3. The 3D Interactive Card ── */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10 p-[1px] rounded-3xl bg-gradient-to-br from-white/20 via-white/5 to-white/0 shadow-[0_0_80px_rgba(99,102,241,0.25)]"
      >
        {/* Deep shadow for the glass container */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl rounded-3xl z-[-1] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]" style={{ transform: 'translateZ(-1px)' }} />

        {/* Decorative elements that pop out in 3D */}
        <motion.div 
          style={{ transform: "translateZ(80px)" }}
          className="absolute -top-12 -right-12 w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 blur-xl opacity-80 pointer-events-none" 
        />
        <motion.div 
          style={{ transform: "translateZ(60px)" }}
          className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 blur-xl opacity-70 pointer-events-none" 
        />

        {/* Inner Content (Clerk Component) */}
        <div 
          style={{ transform: "translateZ(30px)" }}
          className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#0a0a0f] border border-white/20 dark:border-white/10"
        >
          {children}
        </div>
      </motion.div>

      {/* ── 4. Floating Particles in Foreground ── */}
      <div className="absolute inset-0 z-20 pointer-events-none [perspective:1000px]">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            initial={{
              x: Math.random() * 100 + "vw",
              y: Math.random() * 100 + "vh",
              z: Math.random() * 800 - 400,
              scale: Math.random() * 1.5 + 0.5,
            }}
            animate={{
              y: [null, Math.random() * -100 + "vh"],
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  );
}
