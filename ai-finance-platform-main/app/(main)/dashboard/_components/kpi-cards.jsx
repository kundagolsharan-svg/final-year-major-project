"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  PiggyBank, 
  Activity 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function KPICards({ accounts, transactions }) {
  // Compute monthly calculations and balances
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthTransactions = (transactions || []).filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = currentMonthTransactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const expense = currentMonthTransactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalBalance = (accounts || []).reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

    return {
      income,
      expense,
      savings: income - expense,
      netWorth: totalBalance
    };
  }, [accounts, transactions]);

  const cardConfig = [
    {
      title: "Total Net Balance",
      value: stats.netWorth,
      icon: Wallet,
      gradient: "from-[#3B82F6]/20 to-[#3B82F6]/5",
      glowColor: "shadow-blue-500/10",
      accentColor: "text-[#3B82F6]",
      progressColor: "bg-[#3B82F6]",
      percent: 100,
      description: "Aggregate Across All Accounts"
    },
    {
      title: "Monthly Income",
      value: stats.income,
      icon: ArrowUpRight,
      gradient: "from-[#22C55E]/20 to-[#22C55E]/5",
      glowColor: "shadow-green-500/10",
      accentColor: "text-[#22C55E]",
      progressColor: "bg-[#22C55E]",
      percent: stats.income > 0 ? 100 : 0,
      description: "This Month's Inflow"
    },
    {
      title: "Monthly Expenses",
      value: stats.expense,
      icon: ArrowDownRight,
      gradient: "from-[#EF4444]/20 to-[#EF4444]/5",
      glowColor: "shadow-red-500/10",
      accentColor: "text-[#EF4444]",
      progressColor: "bg-[#EF4444]",
      percent: stats.income > 0 ? Math.min(100, (stats.expense / stats.income) * 100) : 0,
      description: `${stats.income > 0 ? ((stats.expense / stats.income) * 100).toFixed(0) : 0}% of Income Used`
    },
    {
      title: "Monthly Savings",
      value: stats.savings,
      icon: PiggyBank,
      gradient: "from-[#8B5CF6]/20 to-[#8B5CF6]/5",
      glowColor: "shadow-purple-500/10",
      accentColor: "text-[#8B5CF6]",
      progressColor: "bg-[#8B5CF6]",
      percent: stats.income > 0 ? Math.max(0, Math.min(100, (stats.savings / stats.income) * 100)) : 0,
      description: `${stats.income > 0 ? Math.max(0, (stats.savings / stats.income) * 100).toFixed(0) : 0}% Savings Rate`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cardConfig.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ 
            y: -5,
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          className={cn(
            "relative p-6 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl bg-gradient-to-br shadow-xl",
            card.gradient,
            card.glowColor
          )}
        >
          {/* Card Glass Layer */}
          <div className="absolute inset-0 bg-white dark:bg-[#1E293B]/60 -z-10" />
          
          {/* Card Top Section */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              {card.title}
            </span>
            <div className={cn("p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner", card.accentColor)}>
              <card.icon size={20} />
            </div>
          </div>

          {/* Value Display */}
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{card.value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              {card.description}
            </span>
          </div>

          {/* Micro Progress Indicator */}
          <div className="mt-5 space-y-2">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${card.percent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn("h-full rounded-full", card.progressColor)}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
