"use client";

import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import { Calendar, CreditCard, RefreshCw, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { cn } from "@/lib/utils";

const INTERVAL_MULTIPLIERS = {
  DAILY: 30.44, // avg days in month
  WEEKLY: 4.33, // avg weeks in month
  MONTHLY: 1,
  YEARLY: 1 / 12,
};

export function SubscriptionHub({ subscriptions }) {
  const { isPrivacyMode } = usePrivacy();
  const { currency } = useCurrency();

  const metrics = useMemo(() => {
    let monthlyCost = 0;
    let yearlyCost = 0;
    
    subscriptions.forEach((sub) => {
      const amount = Number(sub.amount);
      const mult = INTERVAL_MULTIPLIERS[sub.recurringInterval] || 1;
      
      const monthly = sub.type === "EXPENSE" ? amount * mult : 0;
      monthlyCost += monthly;
      yearlyCost += monthly * 12;
    });

    return { monthlyCost, yearlyCost, totalCount: subscriptions.length };
  }, [subscriptions]);

  const sortedSubs = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      if (!a.nextRecurringDate) return 1;
      if (!b.nextRecurringDate) return -1;
      return new Date(a.nextRecurringDate) - new Date(b.nextRecurringDate);
    });
  }, [subscriptions]);

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-3xl border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <RefreshCw size={48} className="text-slate-400 mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No active subscriptions</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          You don't have any recurring transactions set up yet. When you add one, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="text-indigo-100 font-bold text-sm flex items-center gap-2">
              <Calendar size={16} /> Est. Monthly Cost
            </h3>
            <p className={cn("text-3xl font-black mt-2", isPrivacyMode && "blur-md opacity-70")}>
              {currency.symbol}{metrics.monthlyCost.toLocaleString(currency.locale, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white opacity-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" /> Est. Yearly Cost
          </h3>
          <p className={cn("text-2xl font-black text-slate-900 dark:text-white mt-2", isPrivacyMode && "blur-md opacity-70")}>
            {currency.symbol}{metrics.yearlyCost.toLocaleString(currency.locale, { maximumFractionDigits: 0 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm flex items-center gap-2">
            <RefreshCw size={16} className="text-blue-500" /> Active Subscriptions
          </h3>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {metrics.totalCount} Tracked
          </p>
        </motion.div>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white">Upcoming Charges</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {sortedSubs.map((sub, idx) => {
            const isExpense = sub.type === "EXPENSE";
            const amount = Number(sub.amount);
            const nextDate = sub.nextRecurringDate ? new Date(sub.nextRecurringDate) : null;
            
            let daysUntil = null;
            let urgencyClass = "text-slate-500";
            if (nextDate) {
              daysUntil = differenceInDays(nextDate, new Date());
              if (daysUntil <= 3 && daysUntil >= 0) urgencyClass = "text-rose-500 font-bold";
              else if (daysUntil <= 7 && daysUntil >= 0) urgencyClass = "text-amber-500 font-bold";
            }

            return (
              <motion.div 
                key={sub.id} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    isExpense ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {sub.description || sub.category}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg capitalize">
                        {sub.recurringInterval.toLowerCase()}
                      </span>
                      {nextDate && (
                        <span className={cn("text-xs flex items-center gap-1", urgencyClass)}>
                          {daysUntil <= 3 && daysUntil >= 0 && <AlertCircle size={12} />}
                          {daysUntil === 0 ? "Due Today" : daysUntil < 0 ? "Overdue" : `Due in ${daysUntil} days`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-left sm:text-right">
                  <p className={cn(
                    "text-lg font-black",
                    isExpense ? "text-slate-900 dark:text-white" : "text-emerald-500",
                    isPrivacyMode && "blur-sm opacity-60 select-none"
                  )}>
                    {isExpense ? "" : "+"}{currency.symbol}{amount.toLocaleString(currency.locale, { minimumFractionDigits: 2 })}
                  </p>
                  {nextDate && (
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Next: {format(nextDate, "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
