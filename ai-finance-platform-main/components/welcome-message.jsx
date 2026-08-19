"use client";

import React from "react";
import { motion } from "framer-motion";

export const WelcomeMessage = ({ userName }) => {
  if (!userName) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="hidden md:flex items-center mx-4 px-5 py-2.5 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-indigo-200 dark:border-indigo-800/80 shadow-lg shadow-indigo-500/10 cursor-default"
    >
      <motion.span 
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage: "linear-gradient(to right, #6366f1, #a855f7, #ec4899, #f43f5e, #6366f1)",
          backgroundSize: "200% auto",
        }}
        className="text-lg md:text-xl font-black bg-clip-text text-transparent tracking-tight drop-shadow-sm"
      >
        Welcome to SAMPAT, {userName} ✨
      </motion.span>
    </motion.div>
  );
};
