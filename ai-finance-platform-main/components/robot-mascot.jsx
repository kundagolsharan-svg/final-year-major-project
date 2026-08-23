"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";

export const RobotMascot = () => {
  const [text, setText] = useState("");
  const fullText = "Hi! I'm SAMPAT, your AI Financial Advisor. I help you track expenses, manage budgets, analyze spending patterns, optimize savings, and stay on top of your bills with intelligent alerts!";
  const [isTyping, setIsTyping] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    // Delay the robot's entrance and speech
    const timer = setTimeout(() => {
      setShowBubble(true);
      setIsTyping(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isTyping) return;

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 30); // Typing speed

    return () => clearInterval(typingInterval);
  }, [isTyping, fullText]);

  return (
    <div className="absolute top-[5%] md:top-[10%] -left-4 md:-left-20 lg:-left-32 z-[100] pointer-events-none flex flex-col items-start hidden sm:flex">
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
            className="mb-4 ml-12 p-4 rounded-2xl rounded-bl-none bg-white/90 dark:bg-black/80 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-2xl max-w-[300px] md:max-w-[400px]"
            style={{ transform: "translateZ(80px)" }} // Pops out more than the background
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
              {text}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 align-middle"
                />
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 50, opacity: 0, rotate: -20 }}
        animate={{ 
          y: [-10, 10, -10],
          opacity: 1,
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.8, delay: 0.5 } // Initial entrance
        }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 p-[2px] shadow-[0_0_30px_rgba(99,102,241,0.5)]"
        style={{ transform: "translateZ(100px)" }} // Very front
      >
        <div className="w-full h-full rounded-2xl bg-white dark:bg-[#050510] flex items-center justify-center relative overflow-hidden">
          {/* Glowing scanner line effect */}
          <motion.div 
            animate={{ top: ["-50%", "150%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 2 }}
            className="absolute left-0 right-0 h-1 bg-cyan-400/50 blur-sm z-0"
          />
          <Bot size={32} className="text-indigo-600 dark:text-cyan-400 relative z-10" />
        </div>
      </motion.div>
    </div>
  );
};
