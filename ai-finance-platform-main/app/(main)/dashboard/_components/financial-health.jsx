"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FinancialHealthScore({ scoreData }) {
  if (!scoreData || scoreData.status === "Unknown") {
    return null;
  }

  const { score, status, description, metrics } = scoreData;

  // Determine styles based on score
  let textColor = "text-[#EF4444]"; // Expense Red
  let bgColor = "from-[#EF4444]/20 to-[#EF4444]/5";
  let ringColor = "ring-red-500/20";
  let Icon = AlertTriangle;

  if (score >= 70) {
    textColor = "text-[#22C55E]"; // Income Green
    bgColor = "from-[#22C55E]/20 to-[#22C55E]/5";
    ringColor = "ring-green-500/20";
    Icon = CheckCircle2;
  } else if (score >= 40) {
    textColor = "text-[#F59E0B]"; // Amber
    bgColor = "from-amber-500/20 to-amber-500/5";
    ringColor = "ring-amber-500/20";
    Icon = Activity;
  }

  return (
    <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] group transition-all duration-500">
      <CardHeader className={`bg-gradient-to-br ${bgColor} pb-8 px-8 pt-8`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-900 dark:text-white">
            <TrendingUp className="h-6 w-6 text-[#3B82F6]" />
            Health Pulse
          </CardTitle>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-xl group-hover:rotate-12 transition-transform">
            <Icon className={`h-6 w-6 ${textColor}`} />
          </div>
        </div>
        <CardDescription className="text-slate-500 dark:text-slate-400 pt-3 font-bold uppercase tracking-widest text-xs">
          AI Financial Diagnostics
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className={`text-6xl font-black tracking-tighter ${textColor} drop-shadow-sm`}>
              {score}
              <span className="text-xl text-slate-500 font-black ml-1">/100</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest", 
                score >= 70 ? "bg-[#22C55E]/10 text-[#22C55E]" : score >= 40 ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-[#EF4444]/10 text-[#EF4444]")}>
                {status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative h-4 w-full bg-slate-900 rounded-full overflow-hidden mb-8 border border-slate-200 dark:border-white/5">
           <div 
             className={cn("absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full shadow-lg", 
               score >= 70 ? "bg-[#22C55E]" : score >= 40 ? "bg-[#F59E0B]" : "bg-[#EF4444]")}
             style={{ width: `${score}%` }}
           />
        </div>
        
        {metrics && (
          <div className="grid grid-cols-2 gap-6 text-xs font-bold border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="block text-slate-500 uppercase tracking-widest text-sm mb-1">Income</span>
              <span className="text-slate-900 dark:text-white text-sm font-black">₹{metrics.income.toLocaleString()}</span>
            </div>
            <div className="bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="block text-slate-500 uppercase tracking-widest text-sm mb-1">Expenses</span>
              <span className="text-slate-900 dark:text-white text-sm font-black">₹{metrics.expenses.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
