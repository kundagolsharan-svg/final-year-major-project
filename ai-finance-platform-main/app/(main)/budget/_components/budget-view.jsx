"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PiggyBank,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Utensils,
  Zap,
  Car,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Package,
  Bell,
  RefreshCw,
  Target,
  Sliders,
  ChevronRight,
  Info,
} from "lucide-react";
import { updateBudget, resetBudgetAlert } from "@/actions/budget";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, getDaysInMonth, getDate } from "date-fns";
import Link from "next/link";

const CATEGORY_ICONS = {
  shopping: ShoppingBag,
  food: Utensils,
  utilities: Zap,
  transport: Car,
  entertainment: Gamepad2,
  health: HeartPulse,
  education: GraduationCap,
  others: Package,
  "other-expense": Package,
};

const CATEGORY_COLORS = {
  shopping: "#8B5CF6",
  food: "#3B82F6",
  utilities: "#06B6D4",
  transport: "#F59E0B",
  entertainment: "#EC4899",
  health: "#22C55E",
  education: "#F97316",
  others: "#94A3B8",
  "other-expense": "#94A3B8",
};

export function BudgetView({ initialData }) {
  const {
    budget: initialBudget,
    currentExpenses: initialExpenses = 0,
    currentIncome = 0,
    transactions = [],
    accounts = [],
    lastMonthExpenses = 0,
  } = initialData || {};

  const [currentBudgetObj, setCurrentBudgetObj] = useState(initialBudget);
  const [isEditing, setIsEditing] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState(
    initialBudget?.amount ? String(initialBudget.amount) : "25000"
  );
  const [activeTab, setActiveTab] = useState("all");

  const {
    loading: isUpdating,
    fn: updateBudgetFn,
    data: updateResult,
  } = useFetch(updateBudget);

  const now = new Date();
  const daysInCurrentMonth = getDaysInMonth(now);
  const currentDayOfMonth = getDate(now);
  const remainingDaysInMonth = Math.max(1, daysInCurrentMonth - currentDayOfMonth);

  const budgetAmount = currentBudgetObj?.amount || 0;
  const currentExpenses = initialExpenses;
  const percentUsed = budgetAmount > 0 ? (currentExpenses / budgetAmount) * 100 : 0;
  const remainingBudget = Math.max(0, budgetAmount - currentExpenses);
  const isOverBudget = currentExpenses > budgetAmount && budgetAmount > 0;
  const overBudgetAmount = Math.max(0, currentExpenses - budgetAmount);

  // Safe daily allowance for remaining days
  const dailyAllowance = remainingDaysInMonth > 0 ? remainingBudget / remainingDaysInMonth : 0;
  const currentDailyPace = currentDayOfMonth > 0 ? currentExpenses / currentDayOfMonth : 0;
  const projectedMonthEndExpense = currentDailyPace * daysInCurrentMonth;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const cat = (t.category || "others").toLowerCase().trim();
        map[cat] = (map[cat] || 0) + Number(t.amount || 0);
      });

    return Object.entries(map)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        pctOfExpenses: currentExpenses > 0 ? (amount / currentExpenses) * 100 : 0,
        pctOfBudget: budgetAmount > 0 ? (amount / budgetAmount) * 100 : 0,
        color: CATEGORY_COLORS[cat] || "#94A3B8",
        Icon: CATEGORY_ICONS[cat] || Package,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, currentExpenses, budgetAmount]);

  const handleSaveBudget = async (customAmount) => {
    const val = customAmount !== undefined ? customAmount : parseFloat(newBudgetAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid budget amount greater than ₹0");
      return;
    }
    try {
      const res = await updateBudgetFn(val);
      if (res?.success) {
        setCurrentBudgetObj(res.data);
        setIsEditing(false);
        toast.success(`Monthly budget updated to ₹${val.toLocaleString("en-IN")}`);
      } else if (res?.error) {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to update budget");
    }
  };

  const handleQuickPreset = (delta) => {
    const current = budgetAmount || 25000;
    const updated = Math.max(1000, current + delta);
    setNewBudgetAmount(String(updated));
    handleSaveBudget(updated);
  };

  // Status indicators
  const isDanger = percentUsed >= 90;
  const isWarning = percentUsed >= 75 && percentUsed < 90;

  const statusColor = isDanger
    ? "#EF4444"
    : isWarning
    ? "#F59E0B"
    : "#22C55E";

  const statusBadge = isDanger
    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
    : isWarning
    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 bg-[#3B82F6] text-white rounded-xl shadow-md shadow-blue-500/20">
              <PiggyBank size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Monthly Budget Planner
            </h1>
            <span className="text-sm font-bold px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              {format(now, "MMMM yyyy")}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
            Set smart spending limits, track expenses in real-time, and get AI recommendations to optimize your savings.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all"
          >
            <Pencil size={14} />
            {budgetAmount > 0 ? "Edit Budget Limit" : "Set Monthly Budget"}
          </button>
        </div>
      </div>

      {/* ── Edit Budget Modal / In-Page Box ── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#141B2D] border border-indigo-300 dark:border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#3B82F6]" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Configure Monthly Spending Limit
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-6 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  placeholder="e.g. 35000"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                  autoFocus
                />
              </div>

              <div className="md:col-span-6 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleSaveBudget()}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Check size={14} />
                  {isUpdating ? "Saving..." : "Save Limit"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-1 text-sm font-bold text-slate-500 dark:text-slate-400 ml-auto">
                  <span>Quick presets:</span>
                  <button
                    onClick={() => handleQuickPreset(5000)}
                    className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    +₹5K
                  </button>
                  <button
                    onClick={() => handleQuickPreset(-5000)}
                    className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    -₹5K
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Row Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Budget */}
        <div className="bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Monthly Budget</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-[#8B5CF6]">
              <Target size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{budgetAmount.toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {budgetAmount > 0 ? "Configured limit" : "No limit set"}
            </p>
          </div>
        </div>

        {/* Card 2: Spent This Month */}
        <div className="bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Spent This Month</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <TrendingDown size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{currentExpenses.toLocaleString("en-IN")}
            </p>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1">
              {percentUsed.toFixed(1)}% of total budget
            </p>
          </div>
        </div>

        {/* Card 3: Remaining Balance */}
        <div className="bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isOverBudget ? "Over Budget By" : "Remaining Budget"}
            </span>
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center",
                isOverBudget ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
              )}
            >
              {isOverBudget ? <AlertTriangle size={16} /> : <TrendingUp size={16} />}
            </div>
          </div>
          <div>
            <p
              className={cn(
                "text-2xl font-black tracking-tight",
                isOverBudget ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              ₹{(isOverBudget ? overBudgetAmount : remainingBudget).toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isOverBudget ? "Exceeded spending cap" : `${remainingDaysInMonth} days left in month`}
            </p>
          </div>
        </div>

        {/* Card 4: Daily Safe Allowance */}
        <div className="bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Daily Safe Limit</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#3B82F6]">
              <Calendar size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{Math.round(dailyAllowance).toLocaleString("en-IN")}
              <span className="text-xs text-slate-500 font-semibold">/day</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Avg spent: ₹{Math.round(currentDailyPace).toLocaleString("en-IN")}/day
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Progress Bar Section ── */}
      <div className="bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              Budget Consumption Pace
              <span className={cn("text-xs font-black px-2.5 py-0.5 rounded-full border", statusBadge)}>
                {isOverBudget ? "Over Budget" : isDanger ? "Critical (90%+)" : isWarning ? "Warning (75%+)" : "On Track"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual tracker of your spending progress compared against your monthly cap
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Projected Month-End: </span>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              ₹{Math.round(projectedMonthEndExpense).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-slate-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percentUsed)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full transition-all shadow-sm"
              style={{
                background: `linear-gradient(90deg, #3B82F6, ${statusColor})`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
            <span>₹0</span>
            <span>{percentUsed.toFixed(1)}% Consumed (₹{currentExpenses.toLocaleString("en-IN")})</span>
            <span>Limit: ₹{budgetAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Dynamic Alert Banner */}
        {(isWarning || isDanger || isOverBudget) && (
          <div
            className={cn(
              "p-4 rounded-2xl border flex items-start gap-3.5 animate-in fade-in duration-300",
              isOverBudget || isDanger
                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200"
            )}
          >
            <ShieldAlert size={20} className="shrink-0 mt-0.5 text-rose-500" />
            <div className="space-y-1 text-xs">
              <p className="font-black">
                {isOverBudget
                  ? "Monthly Budget Exceeded!"
                  : isDanger
                  ? "Critical Budget Warning: Over 90% Spent"
                  : "Caution: 75% of Monthly Budget Reached"}
              </p>
              <p className="leading-relaxed opacity-90">
                {isOverBudget
                  ? `You have exceeded your monthly limit by ₹${overBudgetAmount.toLocaleString("en-IN")}. Consider pausing non-essential purchases.`
                  : isDanger
                  ? `You only have ₹${remainingBudget.toLocaleString("en-IN")} remaining for the next ${remainingDaysInMonth} days (₹${Math.round(dailyAllowance)}/day).`
                  : `You are spending at ₹${Math.round(currentDailyPace)}/day. Keep daily spending under ₹${Math.round(dailyAllowance)} to stay within budget.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Category Breakdown & AI Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Category Budget Utilization */}
        <div className="lg:col-span-7 bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Spending by Category
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Categories taking up the largest share of your budget
              </p>
            </div>
            <Link
              href="/analyzer"
              className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center gap-1"
            >
              Detailed Analytics <ChevronRight size={14} />
            </Link>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              No expense transactions recorded this month.
            </div>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        <item.Icon size={14} />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white capitalize">
                        {item.category.replace(/-/g, " ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 dark:text-white">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                        ({item.pctOfExpenses.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, item.pctOfExpenses)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 cols: AI Budget Advisor & 50/30/20 Rule */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Smart Advisor */}
          <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-100 dark:from-[#1E1B4B]/50 dark:via-[#141B2D] dark:to-[#0F172A] border border-indigo-200 dark:border-indigo-500/30 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#8B5CF6]">
              <Sparkles size={18} className="animate-pulse" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                AI Budget Recommendations
              </h2>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Pacing Strategy
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {dailyAllowance > 0
                    ? `Limiting non-essential spend to ₹${Math.round(dailyAllowance)}/day will ensure you finish ${format(now, "MMMM")} with ₹${remainingBudget.toLocaleString("en-IN")} in savings.`
                    : "You have crossed your budget. Postpone discretionary shopping to reset next month."}
                </p>
              </div>

              {categoryBreakdown[0] && (
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Top Spending Category
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong className="capitalize">{categoryBreakdown[0].category}</strong> represents{" "}
                    <strong>{categoryBreakdown[0].pctOfExpenses.toFixed(1)}%</strong> of your total expenses this month (₹{categoryBreakdown[0].amount.toLocaleString("en-IN")}).
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Automated 80% Threshold Guard
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  SAMPAT automatically monitors transactions and triggers email alerts with AI advice whenever your spending crosses 80%.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Quick Budget Adjustments
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleQuickPreset(2000)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center"
              >
                +₹2,000 Buffer
              </button>
              <button
                onClick={() => handleQuickPreset(5000)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center"
              >
                +₹5,000 Expansion
              </button>
              <button
                onClick={() => handleQuickPreset(-2000)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center"
              >
                -₹2,000 Strict
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-center"
              >
                Custom Limit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Budget Transactions ── */}
      <div className="bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Recent Budget-Affecting Transactions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live list of expenses logged against your current month's budget
            </p>
          </div>
          <Link
            href="/transaction/create"
            className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center gap-1"
          >
            + Add Transaction
          </Link>
        </div>

        {transactions.filter((t) => t.type === "EXPENSE").length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            No expense transactions logged this month yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions
              .filter((t) => t.type === "EXPENSE")
              .slice(0, 8)
              .map((tx) => {
                const catKey = (tx.category || "others").toLowerCase().trim();
                const Icon = CATEGORY_ICONS[catKey] || Package;
                const col = CATEGORY_COLORS[catKey] || "#94A3B8";

                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: col }}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {tx.description || tx.category || "Expense"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {format(new Date(tx.date), "MMM d, yyyy")} • <span className="capitalize">{tx.category}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                        -₹{Number(tx.amount).toLocaleString("en-IN")}
                      </p>
                      <span className="text-sm text-slate-400 font-semibold uppercase">
                        {tx.status || "COMPLETED"}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
