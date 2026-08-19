"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart2,
  TrendingUp,
  PieChart as PieChartIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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
  salary: "#22C55E",
  income: "#22C55E",
};

const FALLBACK_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#06B6D4",
  "#F59E0B",
  "#EC4899",
  "#22C55E",
  "#F97316",
  "#94A3B8",
];

export function AnalyticsView({ initialTransactions = [] }) {
  const [transactions] = useState(initialTransactions);
  const [timeframe, setTimeframe] = useState("6"); // "3", "6", "12"
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  const numMonths = parseInt(timeframe, 10) || 6;

  // 1. Calculate Monthly Trend
  const monthlyTrendData = useMemo(() => {
    return Array.from({ length: numMonths }).map((_, i) => {
      const d = subMonths(new Date(), numMonths - 1 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);

      const monthlyTxs = transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start, end })
      );
      const income = monthlyTxs
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = monthlyTxs
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: format(d, numMonths > 6 ? "MMM yy" : "MMM yyyy"),
        income,
        expense,
        net: income - expense,
      };
    });
  }, [transactions, numMonths]);

  // 2. Calculate Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const cat = (t.category || "others").toLowerCase().trim();
        map[cat] = (map[cat] || 0) + Number(t.amount);
      });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalExpense = useMemo(
    () => categoryBreakdown.reduce((sum, d) => sum + d.value, 0),
    [categoryBreakdown]
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions]
  );

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;

  const fmt = (n) => `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 animate-in fade-in duration-300 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#3B82F6] text-white rounded-xl shadow-md shadow-blue-500/20">
              <BarChart2 size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Financial Analytics & Trends
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
            Comprehensive historical trends, income-to-expense cash flow metrics, and category distributions.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl shrink-0">
          {[
            { label: "3 Months", value: "3" },
            { label: "6 Months", value: "6" },
            { label: "1 Year", value: "12" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setTimeframe(item.value)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                timeframe === item.value
                  ? "bg-[#3B82F6] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Metric KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow - Green Theme */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-5 shadow-lg shadow-emerald-500/20 space-y-3 transition-all hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Total Inflow
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight">
              {fmt(totalIncome)}
            </p>
            <p className="text-sm text-white/80 mt-0.5">
              All time recorded income
            </p>
          </div>
        </motion.div>

        {/* Total Outflow - Red Theme */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-2xl p-5 shadow-lg shadow-rose-500/20 space-y-3 transition-all hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Total Outflow
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight">
              {fmt(totalExpense)}
            </p>
            <p className="text-sm text-white/80 mt-0.5">
              All time recorded expenses
            </p>
          </div>
        </motion.div>

        {/* Net Savings - Blue/Indigo Gradient */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white rounded-2xl p-5 shadow-lg shadow-indigo-500/20 space-y-3 transition-all hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Net Savings
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight">
              {fmt(netSavings)}
            </p>
            <p className="text-sm text-white/80 mt-0.5">
              Cumulative net balance
            </p>
          </div>
        </motion.div>

        {/* Savings Rate - Orange Theme */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl p-5 shadow-lg shadow-amber-500/20 space-y-3 transition-all hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Savings Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Percent size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight">
              {savingsRate.toFixed(1)}%
            </p>
            <p className="text-sm text-white/80 mt-0.5">
              Of gross income retained
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Main Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 cols: Monthly Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.5 }} className="lg:col-span-7 bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-[#3B82F6]">
                <TrendingUp size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Monthly Cash Flow Trends
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Income vs Expense comparison over the last {timeframe} months
                </p>
              </div>
            </div>
          </div>

          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#334155" : "#E2E8F0"}
                  opacity={0.6}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#64748B" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#64748B" }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                    borderRadius: "16px",
                    color: isDark ? "#F8FAFC" : "#0F172A",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                  itemStyle={{ fontWeight: "700" }}
                  formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`]}
                  cursor={{ fill: isDark ? "#334155" : "#F1F5F9", opacity: 0.5 }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                  formatter={(value) => (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {value}
                    </span>
                  )}
                />
                <Bar dataKey="income" name="Income" fill="#22C55E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right 5 cols: Category Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.6 }} className="lg:col-span-5 bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <PieChartIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Expense Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Breakdown of expenses by category
              </p>
            </div>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs">
              No expense data recorded.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            CATEGORY_COLORS[entry.name] ||
                            FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                        borderColor: isDark ? "#334155" : "#E2E8F0",
                        borderRadius: "14px",
                        color: isDark ? "#F8FAFC" : "#0F172A",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend List */}
              <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                {categoryBreakdown.map((item, index) => {
                  const color =
                    CATEGORY_COLORS[item.name] ||
                    FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                  const pct = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;

                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="capitalize font-bold text-slate-700 dark:text-slate-300">
                          {item.name.replace(/-/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {fmt(item.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
