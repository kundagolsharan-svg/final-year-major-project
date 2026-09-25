"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Bot, User, Send, Sparkles, TrendingUp } from "lucide-react";
import { SpotlightCard } from "./spotlight-card";

export const LandingAIDemo = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });
  
  const [typedText, setTypedText] = useState("");
  const fullText = "How much did I spend on food this month?";
  const [showThinking, setShowThinking] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  useEffect(() => {
    if (isInView) {
      let i = 0;
      // Start typing after a short delay
      const typeTimeout = setTimeout(() => {
        const intervalId = setInterval(() => {
          setTypedText(fullText.slice(0, i + 1));
          i++;
          if (i === fullText.length) {
            clearInterval(intervalId);
            setTimeout(() => setShowThinking(true), 500);
            setTimeout(() => {
              setShowThinking(false);
              setShowResponse(true);
            }, 2500); // Thinking for 2 seconds
          }
        }, 50); // Typing speed
        return () => clearInterval(intervalId);
      }, 500);

      return () => clearTimeout(typeTimeout);
    }
  }, [isInView]);

  return (
    <section className="py-32 relative overflow-hidden bg-[#030308] border-b border-white/5">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10" ref={containerRef}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-bold tracking-wide shadow-[0_0_15px_rgba(236,72,153,0.2)] mb-6">
              <Sparkles size={16} />
              AI Financial Assistant
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Talk to your money, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400">
                literally.
              </span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed font-medium max-w-lg">
              Don't dig through spreadsheets. Just ask SAMPAT exactly what you want to know. Powered by advanced Local LLMs, you get instant, accurate, and deeply contextual answers about your finances.
            </p>
            
            <ul className="space-y-4">
              {["Ask about spending trends", "Detect recurring anomalies", "Get personalized budget advice"].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <TrendingUp size={14} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right Demo Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-[2.5rem] blur-2xl opacity-20" />
            
            <SpotlightCard className="relative w-full max-w-lg mx-auto bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[450px]">
              
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-slate-800/50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">SAMPAT AI</h4>
                  <p className="text-indigo-400 text-xs font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                {/* User Message */}
                <div className="flex items-end justify-end gap-3">
                  <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-br-sm shadow-md max-w-[85%] relative">
                    <p className="text-sm font-medium">{typedText || <span className="opacity-0">.</span>}</p>
                    {isInView && !showThinking && !showResponse && typedText !== fullText && (
                      <motion.span 
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-1.5 h-4 bg-white ml-1 align-middle"
                      />
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-white/10 shadow-sm flex-shrink-0">
                    <User size={14} className="text-slate-300" />
                  </div>
                </div>

                {/* AI Thinking */}
                {showThinking && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="bg-slate-800 text-slate-300 p-4 rounded-2xl rounded-bl-sm border border-white/5 flex gap-1.5 items-center">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                  </motion.div>
                )}

                {/* AI Response */}
                {showResponse && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, transformOrigin: "bottom left" }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="flex items-end gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="bg-slate-800 text-slate-200 p-5 rounded-2xl rounded-bl-sm border border-white/10 shadow-lg w-full max-w-[90%]">
                      <p className="text-sm leading-relaxed mb-4 font-medium">
                        You've spent <strong className="text-pink-400 font-bold">₹12,450</strong> on food this month. That's <strong className="text-emerald-400">15% less</strong> than last month!
                      </p>
                      {/* Fake Bar Chart */}
                      <div className="flex items-end gap-3 h-20 pt-2 border-t border-white/10">
                        <div className="flex flex-col items-center gap-1 w-1/2">
                          <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 1, delay: 0.5 }} className="w-full bg-slate-600 rounded-t-sm" />
                          <span className="text-[10px] text-slate-400 font-bold">LAST MO</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 w-1/2">
                          <motion.div initial={{ height: 0 }} animate={{ height: "85%" }} transition={{ duration: 1, delay: 0.7 }} className="w-full bg-pink-500 rounded-t-sm" />
                          <span className="text-[10px] text-pink-400 font-bold">THIS MO</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="p-4 bg-slate-800/80 border-t border-white/10">
                <div className="bg-slate-900 rounded-full flex items-center px-4 py-3 border border-white/5">
                  <span className="text-slate-500 text-sm flex-1 font-medium">Ask SAMPAT anything...</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Send size={14} />
                  </div>
                </div>
              </div>

            </SpotlightCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
