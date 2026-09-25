"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqData = [
  {
    question: "How does the AI categorization work?",
    answer:
      "SAMPAT uses advanced Local LLMs (like Llama 3 via Ollama) to read the exact merchant name from your statement and contextually assign it to a category. It understands nuances—like knowing 'Zomato' is food and 'Uber' is transportation—without you needing to build rules.",
  },
  {
    question: "Is my financial data safe?",
    answer:
      "Absolutely. We prioritize privacy above all else. Your data is protected by Arcjet security and bank-grade encryption at rest. If you run the local LLM option, your raw statement data never even leaves your server to go to a third-party AI provider like OpenAI.",
  },
  {
    question: "Do I need technical skills to use the Local LLM?",
    answer:
      "Not at all. While the underlying technology is powerful, the platform handles all the AI interaction behind the scenes. Just upload your PDF or CSV, and the AI does the heavy lifting automatically.",
  },
  {
    question: "What statement formats do you support?",
    answer:
      "We currently support raw bank statement PDFs and standard CSV exports from almost any global bank. Our parsing engine is optimized to read messy PDF tables and extract every transaction flawlessly.",
  },
];

export const LandingFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleOpen = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-32 relative bg-slate-50 dark:bg-black overflow-hidden border-t border-slate-200 dark:border-white/5">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold tracking-wide shadow-sm mb-6">
            <HelpCircle size={16} />
            Got questions?
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Questions</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                openIndex === index
                  ? "bg-white dark:bg-slate-900/80 border-indigo-500/50 dark:border-indigo-500/30 shadow-[0_10px_30px_rgba(99,102,241,0.1)] dark:shadow-[0_10px_30px_rgba(99,102,241,0.05)]"
                  : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              }`}
            >
              <button
                onClick={() => toggleOpen(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200 pr-8">
                  {faq.question}
                </h3>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rotate-180" : "bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <ChevronDown size={18} />
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-0 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
