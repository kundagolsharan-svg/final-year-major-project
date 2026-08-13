"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpendingInsights({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <Card className="border-none shadow-2xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="pb-2 pt-8 px-8">
          <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="text-emerald-400" size={24} />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
              <Zap className="text-emerald-400" size={28} />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">All Systems Clear</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-[200px]">Your spending is currently within optimized limits.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-2xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-purple-500/5">
      <CardHeader className="pb-4 pt-8 px-8">
        <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[#EF4444]">
            <AlertTriangle className="animate-pulse" size={22} />
          </div>
          Spending Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className="p-5 rounded-[2rem] bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-3 group hover:bg-[#111827] transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-[#EF4444] bg-rose-500/10 shadow-inner px-3 py-1 rounded-full border border-rose-500/20">
                  {insight.category}
                </span>
                <span className="text-xs font-black text-[#EF4444] flex items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-full">
                  <TrendingUp size={14} />
                  +{insight.percent}%
                </span>
              </div>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200 leading-tight">
                {insight.message}
              </p>
              <div className="flex items-center gap-6 mt-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">Last Month</span>
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400">₹{insight.last.toLocaleString("en-IN")}</span>
                </div>
                <ArrowRight size={14} className="text-slate-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">Current</span>
                  <span className="text-xs font-black text-[#EF4444]">₹{insight.current.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
