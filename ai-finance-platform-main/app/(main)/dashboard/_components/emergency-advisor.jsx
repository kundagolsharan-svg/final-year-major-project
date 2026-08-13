"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmergencyAdvisor({ scoreData }) {
  if (!scoreData || !scoreData.metrics || !scoreData.metrics.emergencyFund) return null;

  const { current, recommended, gap, status } = scoreData.metrics.emergencyFund;
  const percentage = Math.min(100, (current / recommended) * 100);

  return (
    <Card className="border-none shadow-2xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden group">
      <CardHeader className="pb-4 pt-8 px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl text-[#3B82F6]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            Safety Buffer
          </CardTitle>
          <div className={cn(
            "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm",
            status === "Full" ? "bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20" : 
            status === "Partial" ? "bg-amber-500/10 text-[#F59E0B] border border-amber-500/20" : "bg-rose-500/10 text-[#EF4444] border border-rose-500/20"
          )}>
            {status}
          </div>
        </div>
        <CardDescription className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
          Target: ₹{recommended.toLocaleString('en-IN')} (6 Months)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8 space-y-8">
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
            <span>Security Progress</span>
            <span className="text-[#3B82F6]">{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
             <div 
               className={cn("h-full rounded-full transition-all duration-1000 ease-out bg-[#3B82F6]", percentage < 30 && "bg-[#EF4444]", percentage >= 100 && "bg-[#22C55E]")}
               style={{ width: `${percentage}%` }}
             />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">Current Savings</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">₹{current.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">Gap to Goal</p>
            <p className={cn("text-sm font-black", gap > 0 ? "text-[#EF4444]" : "text-[#22C55E]")}>
              ₹{gap.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="p-5 bg-blue-500/5 rounded-[1.5rem] border border-blue-500/10">
          <div className="flex gap-3 items-start">
            <Sparkles className="h-5 w-5 text-[#3B82F6] shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed italic">
              {status === "Full" 
                ? "You're fully protected! Consider investing your surplus to grow your wealth." 
                : status === "Partial"
                ? `Almost there! Saving an extra ₹${Math.round(gap/3).toLocaleString('en-IN')} for 3 months will fill your buffer.`
                : "Your buffer is low. Prioritize building this fund before large discretionary spends."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
