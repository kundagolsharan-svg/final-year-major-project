"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export const Badge3D = ({ icon: Icon, title, description, colorClass, borderClass, bgClass, shadowClass, onClick }) => {
  const containerRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="relative flex items-center justify-center p-2 [perspective:1000px] group cursor-pointer"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative flex flex-col items-center justify-center text-center p-5 w-44 h-48 rounded-3xl border backdrop-blur-xl ${bgClass} ${borderClass} transition-shadow duration-300 group-hover:${shadowClass}`}
      >
        <div 
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${colorClass}`}
          style={{ transform: "translateZ(30px)" }}
        >
          <Icon size={28} />
        </div>
        <h3 
          className="text-sm font-black text-slate-900 dark:text-white mb-1.5"
          style={{ transform: "translateZ(20px)" }}
        >
          {title}
        </h3>
        <p 
          className="text-xs font-semibold text-slate-500 dark:text-slate-400"
          style={{ transform: "translateZ(10px)" }}
        >
          {description}
        </p>
      </motion.div>
    </div>
  );
};
