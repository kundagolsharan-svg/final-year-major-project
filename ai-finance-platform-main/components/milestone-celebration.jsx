"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";

export const MilestoneCelebration = ({ badge, onClose }) => {
  useEffect(() => {
    if (badge) {
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  if (!badge) return null;

  const { icon: Icon, title, description, colorClass } = badge;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex flex-col items-center justify-center p-8 max-w-sm w-full mx-4 rounded-3xl bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 shadow-[0_0_100px_rgba(99,102,241,0.2)] overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors z-20"
          >
            <X size={16} />
          </button>

          {/* Celebration Rings */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2, 2.5], opacity: [0.5, 0.2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute w-32 h-32 rounded-full border-2 border-indigo-500"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2, 2.5], opacity: [0.5, 0.2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute w-32 h-32 rounded-full border-2 border-emerald-500"
          />

          {/* Badge Icon */}
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl relative z-10 ${colorClass}`}
          >
            <Icon size={48} />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center relative z-10"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="text-amber-500" size={18} />
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500">
                Milestone Unlocked!
              </h2>
              <Sparkles className="text-amber-500" size={18} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              {title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
              {description}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
