"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const IMAGES = [
  "/images/landing-hero-bg-2k.jpg",
  "/images/landing-hero-bg.jpg",
];

export const CinematicBackground = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % IMAGES.length);
    }, 6000); // Change image every 6 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.05 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 2, ease: "linear" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Using a slow scale animation (Ken Burns effect) inside the already scaling motion div */}
          <motion.div
            animate={{ scale: [1, 1.1] }}
            transition={{ duration: 10, ease: "linear" }}
            className="w-full h-full relative"
          >
            <Image
              src={IMAGES[currentIndex]}
              alt={`Cinematic Background ${currentIndex}`}
              fill
              priority={currentIndex === 0}
              className="object-cover object-center opacity-80 dark:opacity-90"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Persistent gradient overlay so text remains readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-slate-50/10 to-slate-50/80 dark:from-[#050510]/40 dark:via-[#050510]/10 dark:to-[#050510]/70 z-10 pointer-events-none" />
    </div>
  );
};
