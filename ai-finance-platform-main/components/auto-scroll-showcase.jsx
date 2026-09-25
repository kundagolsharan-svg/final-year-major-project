"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Video } from "lucide-react";

export const AutoScrollShowcase = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollSpeed = 1.2; // Slower, more cinematic speed

  useEffect(() => {
    let intervalId;

    if (isPlaying) {
      // Hide scrollbar for cinematic video effect
      document.body.style.overflow = "hidden";

      intervalId = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollPos = window.innerHeight + window.scrollY;

        if (scrollPos >= scrollHeight - 10) {
          // Restart from the top instead of stopping
          window.scrollTo({ top: 0, behavior: "instant" });
        } else {
          window.scrollBy({ top: scrollSpeed, behavior: "instant" });
        }
      }, 16); // ~60fps
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.body.style.overflow = "auto";
    };
  }, [isPlaying]);

  // Stop auto-scroll if user manually scrolls or presses ESC
  useEffect(() => {
    const handleWheel = (e) => {
      if (isPlaying && Math.abs(e.deltaY) > 20) {
        setIsPlaying(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPlaying) {
        setIsPlaying(false);
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 1 }}
      className="fixed top-24 right-8 z-50 flex items-center justify-center"
    >
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`group relative flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 transition-all overflow-hidden ${isPlaying
            ? "bg-black/40 hover:bg-black/60 shadow-none opacity-50 hover:opacity-100"
            : "bg-slate-900/90 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)]"
          }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

        {isPlaying ? (
          <Pause size={18} className="text-white relative z-10" />
        ) : (
          <Video size={18} className="text-white relative z-10" />
        )}

        <span className="text-sm font-bold text-white tracking-wider uppercase relative z-10">
          {isPlaying ? "Exit Cinematic Video (ESC)" : "Play Cinematic Video"}
        </span>

        {/* Animated border pulse when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0, 1, 0], scale: [1, 1.05, 1.1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-full border-2 border-indigo-500 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
};
