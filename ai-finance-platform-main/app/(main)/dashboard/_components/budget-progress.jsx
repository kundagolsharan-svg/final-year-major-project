"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X, TrendingUp, AlertTriangle, Target } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/budget";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BudgetProgress({ initialBudget, currentExpenses }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const percentUsed = initialBudget
    ? Math.min((currentExpenses / initialBudget.amount) * 100, 100)
    : 0;

  const remaining = initialBudget
    ? Math.max(initialBudget.amount - currentExpenses, 0)
    : 0;

  const isWarning = percentUsed >= 75 && percentUsed < 90;
  const isDanger = percentUsed >= 90;

  const statusColor = isDanger
    ? "#EF4444" // Expense Red
    : isWarning
    ? "#F59E0B" // Amber
    : "#22C55E"; // Income Green

  const statusBg = isDanger
    ? "bg-red-500/10 text-red-200 border-red-500/20"
    : isWarning
    ? "bg-amber-500/10 text-amber-200 border-amber-500/20"
    : "bg-emerald-500/10 text-emerald-200 border-emerald-500/20";

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }
    await updateBudgetFn(amount);
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  return (
    <Card className="border-none shadow-2xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="pb-4 pt-8 px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl text-[#8B5CF6]">
              <Target size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Monthly Budget</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Default Account Focus</p>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-10 w-10 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-[#3B82F6] hover:bg-[#111827] transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-8 space-y-8">
        {isEditing && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">₹</span>
              <Input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="pl-8 rounded-2xl border-slate-200 dark:border-slate-800 bg-[#111827] focus-visible:ring-indigo-500/30 h-12 font-black text-slate-900 dark:text-white"
                placeholder="Enter limit"
                autoFocus
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                onClick={handleUpdateBudget}
                disabled={isLoading}
                className="h-12 w-12 rounded-2xl bg-[#22C55E] hover:bg-emerald-600 text-slate-900 dark:text-white shadow-lg shadow-emerald-500/20"
              >
                <Check className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="h-12 w-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {initialBudget ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-[#111827] p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Spent</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  ₹{currentExpenses.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-[#111827] p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Remaining</p>
                <p className="text-2xl font-black tracking-tighter" style={{ color: statusColor }}>
                  ₹{remaining.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{
                    width: `${percentUsed}%`,
                    background: `linear-gradient(90deg, ${statusColor}dd, ${statusColor})`,
                    boxShadow: `0 0 15px ${statusColor}44`
                  }}
                />
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {percentUsed.toFixed(1)}% Consumed
                </span>
                <span className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest">
                  Limit: ₹{initialBudget.amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {(isWarning || isDanger) && (
              <div className={cn("p-5 rounded-[2rem] border flex items-start gap-4 animate-in fade-in zoom-in duration-500", statusBg)}>
                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                <p className="text-xs font-semibold leading-relaxed">
                  {isDanger
                    ? "Critical: You've exceeded 90% of your budget limit. Immediate expense review recommended."
                    : "Warning: 75% budget usage reached. Pause discretionary spending to remain safe."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-850">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-750">
              <Target size={32} className="text-[#8B5CF6]" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">No Guardrails Active</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-[240px] mb-8">
              Define your monthly spending limit to enable AI monitoring and automated alerts.
            </p>
            <Button
              size="lg"
              onClick={() => setIsEditing(true)}
              className="rounded-2xl bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-slate-900 dark:text-white shadow-xl px-8 font-black uppercase tracking-widest text-[10px]"
            >
              Activate Budget
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
