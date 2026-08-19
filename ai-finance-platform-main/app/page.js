"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  featuresData,
  howItWorksData,
  statsData,
  testimonialsData,
} from "@/data/landing";
import HeroSection from "@/components/hero";
import Link from "next/link";
import { Star, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const LandingPage = () => {
  // Stagger variants for grid items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-500">
      {/* Hero */}
      <HeroSection />

      {/* Stats */}
      <section className="py-20 relative overflow-hidden bg-white dark:bg-black border-t border-slate-100 dark:border-slate-900 transition-colors duration-500">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {statsData.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="premium-card p-8 text-center group bg-white dark:bg-[#0a0a0f] border-slate-100 dark:border-slate-800/60 transition-colors duration-500"
              >
                <div className="text-4xl md:text-5xl font-extrabold mb-2 stat-number text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gradient-to-b from-white to-slate-50 dark:from-black dark:to-[#050510] transition-colors duration-500">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold tracking-wide uppercase mb-4">
              <CheckCircle size={14} />
              Everything you need
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Your complete <motion.span 
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage: "linear-gradient(to right, #6366f1, #a855f7, #ec4899, #f43f5e, #6366f1)",
                  backgroundSize: "200% auto",
                }}
                className="text-transparent bg-clip-text drop-shadow-sm"
              >financial toolkit</motion.span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              From AI-powered insights to goal tracking — SAMPAT gives you
              every tool you need to build lasting financial wellness.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featuresData.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="premium-card p-7 group cursor-default bg-white dark:bg-[#0a0a0f] border-slate-100 dark:border-slate-800/80 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-purple-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative overflow-hidden bg-white dark:bg-black transition-colors duration-500">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Get started in <motion.span 
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage: "linear-gradient(to right, #6366f1, #a855f7, #ec4899, #f43f5e, #6366f1)",
                  backgroundSize: "200% auto",
                }}
                className="text-transparent bg-clip-text drop-shadow-sm"
              >3 simple steps</motion.span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
              Set up your financial command center in minutes, not hours.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 dark:from-indigo-900/50 dark:via-purple-900/50 dark:to-indigo-900/50 z-0" />
            
            {howItWorksData.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center relative z-10"
              >
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6 group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 opacity-15 dark:opacity-20 group-hover:scale-110 transition-transform duration-300" />
                  <div className="w-16 h-16 bg-white dark:bg-black rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-100 dark:border-indigo-900/60 relative z-10 text-indigo-600 dark:text-indigo-400">
                    {step.icon}
                  </div>
                  <span className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white text-xs font-black rounded-full flex items-center justify-center z-20 shadow-md border-2 border-white dark:border-black">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm max-w-xs mx-auto font-medium">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-slate-50/50 dark:bg-[#05050A] transition-colors duration-500 border-y border-slate-100 dark:border-slate-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">real users</span>
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonialsData.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="premium-card p-8 bg-white dark:bg-[#0a0a0f] border-slate-100 dark:border-slate-800/80 transition-colors duration-500"
              >
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="fill-amber-400 text-amber-400 dark:fill-amber-500 dark:text-amber-500"
                    />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed mb-6 font-medium">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 dark:from-indigo-600 dark:to-purple-600 flex items-center justify-center text-white text-sm font-black shadow-inner">
                    {testimonial.author ? testimonial.author.charAt(0) : "U"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {testimonial.author || "Verified User"}
                    </div>
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {testimonial.role || "SAMPAT Member"}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden bg-black transition-colors duration-500">
        {/* Dynamic dark mode background handled by the div below */}
        <div
          className="absolute inset-0 z-0 animate-gradient bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-[#050510]"
          style={{ backgroundSize: "200% 200%" }}
        />
        {/* Subtle dots pattern */}
        <div
          className="absolute inset-0 z-0 opacity-10 dark:opacity-5 mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Ready to take control?
            </h2>
            <p className="text-lg text-indigo-100 dark:text-indigo-200/80 mb-10 max-w-xl mx-auto font-medium">
              Join thousands already saving smarter with SAMPAT AI.
              No credit card required.
            </p>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="px-10 h-14 text-lg font-bold bg-white dark:bg-black text-indigo-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto border-2 border-transparent dark:border-indigo-500/50"
              >
                Start for Free
                <ArrowRight size={20} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-black transition-colors duration-500">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs">S</span>
            SAMPAT Finance
          </div>
          <div className="text-sm font-medium text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} SAMPAT Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
