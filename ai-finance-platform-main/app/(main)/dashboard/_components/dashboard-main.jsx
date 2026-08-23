"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
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
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Sparkles,
  ShoppingBag,
  Utensils,
  Zap,
  Car,
  Gamepad2,
  MoreHorizontal,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  ChevronRight,
  DollarSign,
  Info,
  Calendar,
  ChevronDown,
  FileUp,
  Plus,
  Landmark,
  Trophy,
  Flame,
  Target,
  X,
} from "lucide-react";
import { PDFTransactionUploader } from "./pdf-transaction-uploader";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { ConnectBankModal } from "@/components/connect-bank-modal";
import { Badge3D } from "@/components/badge-3d";
import { MilestoneCelebration } from "@/components/milestone-celebration";
import {
  format,
  subMonths,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subDays,
} from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { useCurrency } from "@/components/providers/currency-provider";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
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
  "#8B5CF6", "#3B82F6", "#06B6D4", "#F59E0B", "#EC4899", "#94A3B8",
];

const CATEGORY_ICONS = {
  shopping: ShoppingBag,
  food: Utensils,
  utilities: Zap,
  transport: Car,
  entertainment: Gamepad2,
  others: MoreHorizontal,
  "other-expense": MoreHorizontal,
};

const TIME_RANGES = [
  { key: "this_month", label: "This Month" },
  { key: "last_week", label: "Last Week" },
  { key: "last_month", label: "Last Month" },
  { key: "6_months", label: "6 Months" },
  { key: "all_time", label: "All Time" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get date window for a range key
// ─────────────────────────────────────────────────────────────────────────────
function getRangeWindow(key) {
  const now = new Date();
  switch (key) {
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last_week":
      return {
        start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
      };
    case "last_month": {
      const lm = subMonths(now, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case "6_months":
      return { start: subDays(now, 180), end: now };
    case "all_time":
    default:
      return { start: new Date(0), end: now };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: previous comparable window (for % change in KPIs)
// ─────────────────────────────────────────────────────────────────────────────
function getPrevWindow(key) {
  const now = new Date();
  switch (key) {
    case "this_month": {
      const lm = subMonths(now, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case "last_week":
      return {
        start: startOfWeek(subWeeks(now, 2), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(now, 2), { weekStartsOn: 1 }),
      };
    case "last_month": {
      const prev = subMonths(now, 2);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case "6_months":
      return { start: subDays(now, 360), end: subDays(now, 181) };
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline SVG
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ color, up }) {
  const pts = up
    ? [8, 12, 10, 16, 14, 20, 18, 24, 22]
    : [22, 18, 20, 14, 16, 10, 12, 8, 10];
  const max = Math.max(...pts), min = Math.min(...pts);
  const range = max - min || 1;
  const W = 96, H = 36;
  const coords = pts.map((p, i) => `${(i / (pts.length - 1)) * W},${H - ((p - min) / range) * H}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-70">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={`url(#sg-${color.replace("#", "")})`}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={coords} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Donut Centre Label
// ─────────────────────────────────────────────────────────────────────────────
function DonutLabel({ cx, cy, totalExpense, symbol, locale }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-10" fill="#94A3B8" fontSize="9" fontWeight="700">TOTAL</tspan>
      <tspan x={cx} dy="18" fill="#FFFFFF" fontSize="13" fontWeight="900">
        {symbol}{totalExpense >= 1000
          ? `${(totalExpense / 1000).toFixed(1)}K`
          : totalExpense.toLocaleString(locale)}
      </tspan>
    </text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Time Range Dropdown
// ─────────────────────────────────────────────────────────────────────────────
function RangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = TIME_RANGES.find((r) => r.key === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <Calendar size={11} className="text-slate-500 dark:text-slate-400" />
        {current?.label}
        <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1.5 z-50 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden w-36"
          >
            {TIME_RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => { onChange(r.key); setOpen(false); }}
                className={cn(
                  "w-full text-left text-xs font-semibold px-4 py-2.5 transition-colors",
                  r.key === value
                    ? "bg-[#3B82F6] text-slate-900 dark:text-white font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-900 dark:text-white"
                )}
              >
                {r.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function DashboardMain({ accounts, transactions, spendingInsights }) {
  const { isPrivacyMode } = usePrivacy();
  const { currency } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);
  const [range, setRange] = useState("this_month");
  const [showPdfUploader, setShowPdfUploader] = useState(false);
  const [celebratedBadge, setCelebratedBadge] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => setIsMounted(true), []);

  const allTx = useMemo(() => transactions || [], [transactions]);

  // ── Window for selected range ───────────────────────────────────────────
  const { start: winStart, end: winEnd } = useMemo(() => getRangeWindow(range), [range]);
  const prevWindow = useMemo(() => getPrevWindow(range), [range]);

  // ── Filter helpers ──────────────────────────────────────────────────────
  const inWindow = (t, s, e) => {
    const d = new Date(t.date);
    return d >= s && d <= e;
  };

  const sum = (arr, type) =>
    arr.filter((t) => t.type === type).reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // ── Transactions in range ──────────────────────────────────────────────
  const windowTx = useMemo(
    () => allTx.filter((t) => inWindow(t, winStart, winEnd)),
    [allTx, winStart, winEnd]
  );

  const prevTx = useMemo(
    () => (prevWindow ? allTx.filter((t) => inWindow(t, prevWindow.start, prevWindow.end)) : []),
    [allTx, prevWindow]
  );

  // ── KPI stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const income = sum(windowTx, "INCOME");
    const expense = sum(windowTx, "EXPENSE");
    const savings = income - expense;
    const totalBalance = (accounts || []).reduce((s, a) => s + (Number(a.balance) || 0), 0);

    const prevIncome = sum(prevTx, "INCOME");
    const prevExpense = sum(prevTx, "EXPENSE");
    const prevSavings = prevIncome - prevExpense;

    const pct = (curr, prev) =>
      prev === 0 ? null : Number(((curr - prev) / Math.abs(prev)) * 100).toFixed(1);

    return {
      income, expense, savings, totalBalance,
      incomePct: pct(income, prevIncome),
      expensePct: pct(expense, prevExpense),
      savingsPct: pct(savings, prevSavings),
    };
  }, [windowTx, prevTx, accounts]);

  // ── Bar chart: buckets depending on range ──────────────────────────────
  const barChartData = useMemo(() => {
    const now = new Date();
    if (range === "last_week" || range === "this_month") {
      // Show daily buckets for last 7 days or current month
      const days = range === "last_week" ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const base = range === "last_week" ? subDays(now, 6) : startOfMonth(now);
      return Array.from({ length: Math.min(days, 31) }, (_, i) => {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        const label = format(d, "d");
        const dayStart = new Date(d.setHours(0, 0, 0, 0));
        const dayEnd = new Date(new Date(dayStart).setHours(23, 59, 59, 999));
        const slice = allTx.filter((t) => inWindow(t, dayStart, dayEnd));
        return { label, income: sum(slice, "INCOME"), expense: sum(slice, "EXPENSE") };
      });
    }
    // Monthly buckets for longer ranges
    const months = range === "6_months" ? 6 : Math.min(
      Math.ceil((winEnd - winStart) / (1000 * 60 * 60 * 24 * 30)) + 1,
      24
    );
    return Array.from({ length: months }, (_, i) => {
      const d = subMonths(now, months - 1 - i);
      const s = startOfMonth(d), e = endOfMonth(d);
      const slice = allTx.filter((t) => inWindow(t, s, e));
      return { label: format(d, "MMM"), income: sum(slice, "INCOME"), expense: sum(slice, "EXPENSE") };
    });
  }, [allTx, range, winStart, winEnd]);

  // ── Donut data: expense by category ────────────────────────────────────
  const { pieData, totalExpense } = useMemo(() => {
    const map = {};
    windowTx
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const cat = (t.category || "others").toLowerCase().trim();
        map[cat] = (map[cat] || 0) + (Number(t.amount) || 0);
      });

    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const data = Object.entries(map)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { pieData: data, totalExpense: total };
  }, [windowTx]);

  // ── Top categories ──────────────────────────────────────────────────────
  const topCategories = useMemo(() => pieData.slice(0, 5), [pieData]);

  // ── Recent transactions ─────────────────────────────────────────────────
  const recentTransactions = useMemo(
    () => [...windowTx].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [windowTx]
  );

  // ── AI Insights ─────────────────────────────────────────────────────────
  const aiInsights = useMemo(() => {
    const list = (spendingInsights || []).slice(0, 2).map((s) => ({
      icon: TrendingUp,
      color: "#EF4444",
      bg: "bg-red-500/10",
      title: `Increased spending in ${s.category.replace(/-/g, " ")}`,
      text: `You've spent ${currency.symbol}${Number(s.increase).toLocaleString(currency.locale)} more on ${s.category.replace(/-/g, " ")} than last month.`,
      highlight: `+${s.percent}%`,
      sub: "vs last month",
    }));

    if (list.length === 0) {
      list.push({
        icon: Sparkles,
        color: "#3B82F6",
        bg: "bg-blue-500/10",
        title: "AI Analysis Ready",
        text: "Track your expenses regularly to get personalized AI-powered spending insights and recommendations.",
        highlight: null,
        sub: "Add transactions to start",
      });
    }

    if (topCategories[0]) {
      list.push({
        icon: ShoppingBag,
        color: "#F59E0B",
        bg: "bg-amber-500/10",
        title: `High spending on ${topCategories[0].name.replace(/-/g, " ")}`,
        text: `A significant portion of your recent spending is going towards ${topCategories[0].name.replace(/-/g, " ")}.`,
        highlight: `${currency.symbol}${topCategories[0].value.toLocaleString(currency.locale)}`,
        sub: "this period",
      });
    }

    list.push({
      icon: DollarSign,
      color: "#8B5CF6",
      bg: "bg-purple-500/10",
      title: "Optimization Opportunity",
      text: "Consider reviewing your non-essential subscriptions and expenses to improve your monthly savings rate.",
      highlight: "Tip",
      sub: "SAMPAT AI recommendation",
    });

    return list.slice(0, 3);
  }, [spendingInsights, topCategories]);

  // ── Alerts ─────────────────────────────────────────────────────────────
  const recentAlerts = useMemo(() => {
    const alerts = [];
    allTx
      .filter((t) => t.type === "EXPENSE" && Number(t.amount) > 15000)
      .slice(0, 1)
      .forEach((t) => {
        alerts.push({
          icon: AlertTriangle,
          color: "#EF4444",
          bg: "bg-red-500/10 border-red-500/20",
          title: `High spending in ${(t.category || "expense").replace(/-/g, " ")}`,
          date: format(new Date(t.date), "MMM d, yyyy"),
        });
      });
    alerts.push({
      icon: ShieldAlert,
      color: "#F59E0B",
      bg: "bg-amber-500/10 border-amber-500/20",
      title: "Unusual transaction detected",
      date: format(new Date(), "MMM d, yyyy"),
    });
    alerts.push({
      icon: Info,
      color: "#3B82F6",
      bg: "bg-blue-500/10 border-blue-500/20",
      title: "Budget limit exceeded",
      date: format(new Date(), "MMM d, yyyy"),
    });
    return alerts.slice(0, 3);
  }, [allTx]);

  // ── Formatters ──────────────────────────────────────────────────────────
  const fmt = (n) =>
    `${currency.symbol}${Math.abs(n).toLocaleString(currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const rangeName = TIME_RANGES.find((r) => r.key === range)?.label ?? "Period";

  // ── KPI card config ────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: "Total Income",
      value: fmt(stats.income),
      pct: stats.incomePct,
      up: Number(stats.incomePct) >= 0,
      icon: Wallet,
      cardBg: "bg-gradient-to-br from-[#065f46] via-[#047857] to-[#064e3b] text-white",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      labelColor: "text-emerald-100 uppercase tracking-wider",
      valueColor: "text-white",
      subColor: "text-emerald-200",
      sparkColor: "#6EE7B7",
      border: "border-emerald-600/40",
      glow: "shadow-xl shadow-emerald-950/20",
    },
    {
      label: "Total Expense",
      value: fmt(stats.expense),
      pct: stats.expensePct,
      up: Number(stats.expensePct) <= 0,
      icon: ArrowDownRight,
      cardBg: "bg-gradient-to-br from-[#991b1b] via-[#b91c1c] to-[#7f1d1d] text-white",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      labelColor: "text-rose-100 uppercase tracking-wider",
      valueColor: "text-white",
      subColor: "text-rose-200",
      sparkColor: "#FCA5A5",
      border: "border-rose-600/40",
      glow: "shadow-xl shadow-rose-950/20",
    },
    {
      label: "Net Savings",
      value: fmt(stats.savings),
      pct: stats.savingsPct,
      up: stats.savings >= 0,
      icon: PiggyBank,
      cardBg: "bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#9a3412] text-white",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      labelColor: "text-orange-100 uppercase tracking-wider",
      valueColor: "text-white",
      subColor: "text-orange-200",
      sparkColor: "#FDBA74",
      border: "border-orange-600/40",
      glow: "shadow-xl shadow-orange-950/20",
    },
    {
      label: "Total Balance",
      value: fmt(stats.totalBalance),
      pct: null,
      up: true,
      icon: ArrowUpRight,
      cardBg: "bg-gradient-to-br from-[#6b21a8] via-[#7e22ce] to-[#581c87] text-white",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      labelColor: "text-purple-100 uppercase tracking-wider",
      valueColor: "text-white",
      subColor: "text-purple-200",
      sparkColor: "#C4B5FD",
      border: "border-purple-600/40",
      glow: "shadow-xl shadow-purple-950/20",
    },
  ];

  // ── Custom Tooltip ──────────────────────────────────────────────────────
  const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs shadow-2xl min-w-[140px]">
        <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
              <span className="text-slate-600 dark:text-slate-300">{p.name}</span>
            </div>
            <span className="font-black text-slate-900 dark:text-white">{currency.symbol}{p.value.toLocaleString(currency.locale)}</span>
          </div>
        ))}
      </div>
    );
  };

  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-2xl">
        <p className="text-slate-900 dark:text-white font-black capitalize mb-0.5">
          {payload[0].name.replace(/-/g, " ")}
        </p>
        <p className="text-slate-600 dark:text-slate-300">
          {fmt(payload[0].value)}{" "}
          <span className="text-slate-500">({payload[0].payload.pct}%)</span>
        </p>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-10">

      {/* ── Header + Global Range Picker ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Welcome back, {accounts?.[0]?.name?.split(" ")[0] || "User"}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Here&apos;s your financial overview</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ConnectBankModal>
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 transition-all cursor-pointer">
              <Landmark size={14} />
              Connect Bank (AA)
            </button>
          </ConnectBankModal>

          <CreateAccountDrawer>
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer">
              <Plus size={14} />
              Add Account
            </button>
          </CreateAccountDrawer>

          <button
            onClick={() => setShowPdfUploader((prev) => !prev)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <FileUp size={14} />
            {showPdfUploader ? "Hide Uploader" : "Upload PDF Statement"}
          </button>

          {TIME_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                range === r.key
                  ? "bg-[#3B82F6] text-slate-900 dark:text-white shadow-lg shadow-blue-500/25"
                  : "bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── PDF Statement Upload Section ── */}
      <AnimatePresence>
        {showPdfUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <PDFTransactionUploader
              accounts={accounts || []}
              onUploadSuccess={() => {
                // Keep uploader open so user sees summary, or user can close
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Accounts Quick Strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.4, delay: 0.1 }}
        className="p-4 rounded-2xl bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Wallet size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Connected Accounts ({accounts?.length || 0})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time balance & auto-sync ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 no-scrollbar">
          {accounts?.map((acc) => (
            <motion.div key={acc.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link
                href={`/account/${acc.id}`}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all shrink-0 flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">
                    {acc.name}
                  </p>
                  <p className={cn("text-xs font-bold text-emerald-600 dark:text-emerald-400", isPrivacyMode && "blur-sm opacity-60 select-none")}>
                    {currency.symbol}{Number(acc.balance || 0).toLocaleString(currency.locale)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}

          <ConnectBankModal>
            <button className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer">
              <Landmark size={13} />
              <span>Link AA Bank</span>
            </button>
          </ConnectBankModal>

          <CreateAccountDrawer>
            <button className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer">
              <Plus size={13} />
              <span>Add Manual</span>
            </button>
          </CreateAccountDrawer>
        </div>
      </motion.div>


      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.3, delay: i * 0.07 }}
            className={cn(
              "relative rounded-2xl p-5 border overflow-hidden shadow-lg transition-all duration-300",
              card.cardBg,
              card.border,
              card.glow
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.iconBg)}>
                <card.icon size={18} className={card.iconColor} />
              </div>
              <span className={cn("text-sm font-bold", card.labelColor)}>{card.label}</span>
            </div>

            <p className={cn("text-[22px] font-black tracking-tight leading-none", card.valueColor, isPrivacyMode && "blur-md opacity-60 select-none")}>
              {card.value}
            </p>

            {card.pct !== null ? (
              <p className={cn(
                "text-sm font-bold mt-1.5 flex items-center gap-0.5",
                card.subColor
              )}>
                {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(card.pct)}% vs prev {rangeName}
              </p>
            ) : (
              <p className={cn("text-sm font-semibold mt-1.5", card.subColor)}>Updated just now</p>
            )}

            {/* Sparkline */}
            <div className="absolute bottom-3 right-3 pointer-events-none opacity-80">
              <Sparkline color={card.sparkColor} up={card.up} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Row 2: Bar Chart | Donut | Top Categories ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Income vs Expense Bar Chart */}
        <motion.div
          layoutId="income-expense-card"
          onClick={() => setExpandedCard("income-expense")}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-5 bg-white dark:bg-[#0a0a0f] rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Income vs Expense Overview</h2>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg font-semibold">
              {rangeName}
            </span>
          </div>

          {!isMounted ? (
            <div className="h-[220px] animate-pulse bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
          ) : barChartData.every((d) => d.income === 0 && d.expense === 0) ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-center gap-2">
              <TrendingUp size={28} className="text-slate-700" />
              <p className="text-slate-500 text-xs font-semibold">No data for {rangeName}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={barChartData} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="label" axisLine={false} tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 10, fontWeight: 700 }}
                  interval={barChartData.length > 15 ? Math.floor(barChartData.length / 10) : 0}
                />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                />
                <Tooltip content={<BarTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }} />
                <Legend iconType="circle" iconSize={7}
                  wrapperStyle={{ fontSize: "10px", fontWeight: 700, paddingTop: "10px", color: "#94A3B8" }}
                />
                <Area type="monotone" name="Income" dataKey="income" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" filter="url(#glow)" />
                <Area type="monotone" name="Expense" dataKey="expense" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" filter="url(#glow)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Expense by Category Donut */}
        <motion.div
          layoutId="expense-card"
          onClick={() => setExpandedCard("expense")}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-4 bg-white dark:bg-[#0a0a0f] rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Expense by Category</h2>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg font-semibold">
              {rangeName}
            </span>
          </div>

          {!isMounted ? (
            <div className="h-[240px] animate-pulse bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
          ) : pieData.length === 0 ? (
            <div className="h-[240px] flex flex-col items-center justify-center text-center gap-2">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <DollarSign size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-500 text-xs font-semibold">No expense data for {rangeName}</p>
              <p className="text-slate-600 text-xs">Add some transactions to see the breakdown</p>
            </div>
          ) : (
            <div className="flex gap-4 items-start">
              {/* Donut */}
              <div className="shrink-0">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                      labelLine={false}
                      label={({ cx, cy }) => (
                        <DonutLabel cx={cx} cy={cy} totalExpense={totalExpense} symbol={currency.symbol} locale={currency.locale} />
                      )}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                          stroke="transparent"
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2 pt-2">
                {pieData.map((d, i) => {
                  const color = CATEGORY_COLORS[d.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                  return (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-slate-600 dark:text-slate-300 capitalize font-semibold">
                          {d.name.replace(/-/g, " ")}
                        </span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold ml-2">{d.pct}%</span>
                    </div>
                  );
                })}
                <div className="pt-2 mt-1 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 font-semibold">Total Expense</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{fmt(totalExpense)}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Top Spending Categories */}
        <motion.div
          layoutId="top-spending-card"
          onClick={() => setExpandedCard("top-spending")}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-3 bg-white dark:bg-[#0a0a0f] rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Top Spending</h2>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg font-semibold">
              {rangeName}
            </span>
          </div>

          {topCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-semibold">
              No expenses for {rangeName}
            </div>
          ) : (
            <div className="space-y-3">
              {topCategories.map((cat, i) => {
                const Icon = CATEGORY_ICONS[cat.name] || MoreHorizontal;
                const color = CATEGORY_COLORS[cat.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                const maxVal = topCategories[0].value;
                const barW = maxVal > 0 ? Math.round((cat.value / maxVal) * 100) : 0;
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${color}22` }}
                        >
                          <Icon size={13} style={{ color }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">
                          {cat.name.replace(/-/g, " ")}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                        {fmt(cat.value)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        key={`${cat.name}-${range}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barW}%` }}
                        transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Row 3: Recent Transactions | AI Insights | Recent Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-5 bg-white dark:bg-[#0a0a0f] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Recent Transactions</h2>
            <Link href="/transaction/create"
              className="text-xs text-[#3B82F6] font-bold flex items-center gap-0.5 hover:underline">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[90px_1fr_90px_80px] px-5 py-2 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/40">
            <span>Date</span>
            <span>Description</span>
            <span>Category</span>
            <span className="text-right">Amount</span>
          </div>

          <div className="divide-y divide-slate-800/40">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => {
                const cat = (t.category || "others").toLowerCase();
                const catColor = CATEGORY_COLORS[cat] || "#94A3B8";
                return (
                  <div key={t.id}
                    className="grid grid-cols-[90px_1fr_90px_80px] px-5 py-3 items-center hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                      {format(new Date(t.date), "MMM d, yyyy")}
                    </span>
                    <span className="text-sm text-slate-900 dark:text-white font-bold truncate pr-2">
                      {t.description || "Transaction"}
                    </span>
                    <span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-black capitalize whitespace-nowrap"
                        style={{ background: `${catColor}20`, color: catColor }}>
                        {cat.replace(/-/g, " ")}
                      </span>
                    </span>
                    <span className={cn(
                      "text-right text-sm font-black tabular-nums",
                      t.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {t.type === "INCOME" ? "+" : "-"}{fmt(Number(t.amount))}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs font-semibold">
                No transactions for {rangeName}
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-4 bg-white dark:bg-[#0a0a0f] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/10 rounded-lg">
                <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">AI Insights</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>

          <div className="p-4 space-y-3 flex-1 flex flex-col">
            {aiInsights.map((ins, i) => (
              <div key={i} className="group p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#1A2235] dark:hover:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700/50 transition-all duration-200">
                <div className="flex items-start gap-3.5">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", ins.bg)}>
                    <ins.icon size={16} style={{ color: ins.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                      {ins.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2 line-clamp-2">
                      {ins.text}
                    </p>
                    <div className="flex items-center gap-2 mt-auto">
                      {ins.highlight && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md" style={{ color: ins.color, backgroundColor: `${ins.color}15`, border: `1px solid ${ins.color}30` }}>
                          {ins.highlight}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {ins.sub}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-auto pt-2">
              <Link href="/analyzer"
                className="flex items-center justify-center gap-1.5 w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md">
                <Sparkles size={12} />
                Open Full AI Analysis
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="lg:col-span-3 bg-white dark:bg-[#0a0a0f] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Recent Alerts</h2>
            <Link href="/dashboard#alerts"
              className="text-xs text-[#3B82F6] font-bold flex items-center gap-0.5 hover:underline">
              View All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentAlerts.map((alert, i) => (
              <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl border", alert.bg)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${alert.color}20` }}>
                  <alert.icon size={14} style={{ color: alert.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{alert.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{alert.date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Row 4: Gamification & Milestones ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-amber-500" size={20} />
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Milestones & Achievements
          </h2>
        </div>
        <div className="flex flex-wrap gap-6 items-center justify-center lg:justify-start">
          <Badge3D
            icon={Trophy}
            title="Budget Master"
            description="Stayed under budget for 3 consecutive months."
            colorClass="text-amber-500 bg-amber-500/20"
            borderClass="border-amber-500/30"
            bgClass="bg-white/5"
            shadowClass="shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            onClick={() => setCelebratedBadge({
              icon: Trophy,
              title: "Budget Master",
              description: "Stayed under budget for 3 consecutive months.",
              colorClass: "text-amber-500 bg-amber-500/20"
            })}
          />
          <Badge3D
            icon={Target}
            title="First 10K Saved"
            description={`Reached ${currency.symbol}10,000 in net savings this month!`}
            colorClass="text-emerald-500 bg-emerald-500/20"
            borderClass="border-emerald-500/30"
            bgClass="bg-white/5"
            shadowClass="shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            onClick={() => setCelebratedBadge({
              icon: Target,
              title: "First 10K Saved",
              description: `Reached ${currency.symbol}10,000 in net savings this month!`,
              colorClass: "text-emerald-500 bg-emerald-500/20"
            })}
          />
          <Badge3D
            icon={Flame}
            title="7-Day Streak"
            description="Logged expenses for 7 days in a row."
            colorClass="text-rose-500 bg-rose-500/20"
            borderClass="border-rose-500/30"
            bgClass="bg-white/5"
            shadowClass="shadow-[0_0_30px_rgba(244,63,94,0.2)]"
            onClick={() => setCelebratedBadge({
              icon: Flame,
              title: "7-Day Streak",
              description: "Logged expenses for 7 days in a row.",
              colorClass: "text-rose-500 bg-rose-500/20"
            })}
          />
        </div>
      </motion.div>

      {/* Milestone Celebration Popup */}
      <MilestoneCelebration
        badge={celebratedBadge}
        onClose={() => setCelebratedBadge(null)}
      />

      {/* Expanded Modal Overlay */}
      <AnimatePresence>
        {expandedCard === "expense" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedCard(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100]"
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8 pointer-events-none">
              <motion.div
                layoutId="expense-card"
                className="bg-white dark:bg-[#0a0a0f] rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto pointer-events-auto flex flex-col relative"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.2)"
                }}
              >
                <button
                  onClick={() => setExpandedCard(null)}
                  className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
                >
                  <X size={22} strokeWidth={3} />
                </button>
                
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Detailed Expense Analysis</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-lg flex items-center gap-2">
                  <Calendar size={18} />
                  {rangeName}
                </p>
                
                <div className="flex flex-col md:flex-row gap-12 items-center md:items-start flex-1">
                  <div className="w-full md:w-1/2 flex items-center justify-center relative min-h-[350px]">
                     <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] -z-10" />
                     <ResponsiveContainer width="100%" height={400} className="max-w-[400px]">
                       <PieChart>
                         <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius={90}
                           outerRadius={150}
                           paddingAngle={4}
                           dataKey="value"
                           animationBegin={0}
                           animationDuration={1500}
                           labelLine={false}
                           label={({ cx, cy }) => (
                             <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                               <tspan x={cx} dy="-15" fill="#94A3B8" fontSize="14" fontWeight="800" letterSpacing="0.1em">TOTAL EXPENSE</tspan>
                               <tspan x={cx} dy="30" fill="currentColor" className="dark:fill-white fill-slate-900" fontSize="32" fontWeight="900">
                                 {currency.symbol}{totalExpense >= 1000 ? `${(totalExpense / 1000).toFixed(1)}K` : totalExpense.toLocaleString(currency.locale)}
                               </tspan>
                             </text>
                           )}
                         >
                           {pieData.map((entry, index) => (
                             <Cell
                               key={`cell-${index}`}
                               fill={CATEGORY_COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                               stroke="rgba(255,255,255,0.15)"
                               strokeWidth={2}
                               style={{ filter: "drop-shadow(0px 20px 25px rgba(0,0,0,0.3))" }}
                             />
                           ))}
                         </Pie>
                         <Tooltip content={<PieTooltip />} />
                       </PieChart>
                     </ResponsiveContainer>
                  </div>
                  
                  <div className="w-full md:w-1/2 space-y-4 pt-4">
                    {pieData.map((d, i) => {
                      const color = CATEGORY_COLORS[d.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                      return (
                        <motion.div 
                          key={d.name} 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + (i * 0.08), type: "spring", stiffness: 300, damping: 24 }}
                          className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-white dark:bg-[#0f172a]" style={{ borderLeft: `4px solid ${color}` }}>
                              <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: color }} />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white capitalize font-extrabold text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {d.name.replace(/-/g, " ")}
                              </p>
                              <p className="text-slate-500 font-bold tracking-wide">{d.pct}% of total</p>
                            </div>
                          </div>
                          <span className="text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform">{fmt(d.value)}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
        {expandedCard === "income-expense" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedCard(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100]"
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8 pointer-events-none">
              <motion.div
                layoutId="income-expense-card"
                className="bg-white dark:bg-[#0a0a0f] rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto pointer-events-auto flex flex-col relative"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.2)"
                }}
              >
                <button
                  onClick={() => setExpandedCard(null)}
                  className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
                >
                  <X size={22} strokeWidth={3} />
                </button>
                
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Income vs Expense Overview</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-lg flex items-center gap-2">
                  <Calendar size={18} />
                  {rangeName}
                </p>

                <div className="flex-1 w-full relative min-h-[400px]">
                  <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-3xl blur-[100px] -z-10" />
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={barChartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncomeLg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpenseLg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                        <filter id="glowLg" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="6" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 700 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} dx={-10} />
                      <Tooltip content={<BarTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 2 }} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "14px", fontWeight: 700, paddingTop: "20px", color: "#94A3B8" }} />
                      <Area type="monotone" name="Income" dataKey="income" stroke="#22C55E" strokeWidth={4} fillOpacity={1} fill="url(#colorIncomeLg)" filter="url(#glowLg)" activeDot={{ r: 8, strokeWidth: 0, fill: "#22C55E" }} />
                      <Area type="monotone" name="Expense" dataKey="expense" stroke="#EF4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExpenseLg)" filter="url(#glowLg)" activeDot={{ r: 8, strokeWidth: 0, fill: "#EF4444" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </>
        )}
        {expandedCard === "top-spending" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedCard(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100]"
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8 pointer-events-none">
              <motion.div
                layoutId="top-spending-card"
                transition={{ duration: 0.8, type: "spring", bounce: 0.35 }}
                className="bg-white dark:bg-[#0a0a0f] rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto flex flex-col relative"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.2)"
                }}
              >
                <button
                  onClick={() => setExpandedCard(null)}
                  className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
                >
                  <X size={22} strokeWidth={3} />
                </button>
                
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Top Spending Categories</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-lg flex items-center gap-2">
                  <Calendar size={18} />
                  {rangeName}
                </p>

                {topCategories.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-lg font-semibold flex flex-col items-center gap-4">
                    <TrendingUp size={48} className="opacity-20" />
                    No expenses for {rangeName}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {topCategories.map((cat, i) => {
                      const Icon = CATEGORY_ICONS[cat.name] || MoreHorizontal;
                      const color = CATEGORY_COLORS[cat.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                      const maxVal = topCategories[0].value;
                      const barW = maxVal > 0 ? Math.round((cat.value / maxVal) * 100) : 0;
                      return (
                        <motion.div 
                          key={cat.name} 
                          initial={{ opacity: 0, x: -30, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ delay: 0.3 + (i * 0.15), type: "spring", stiffness: 200, damping: 20 }}
                          className="p-5 md:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm group"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-500"
                                style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                              >
                                <Icon size={24} style={{ color }} />
                              </div>
                              <div>
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white capitalize group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {cat.name.replace(/-/g, " ")}
                                </h3>
                                <p className="text-slate-500 font-semibold">{cat.pct}% of total expense</p>
                              </div>
                            </div>
                            <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                              {fmt(cat.value)}
                            </span>
                          </div>
                          
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                            <motion.div
                              key={`${cat.name}-${range}-expanded`}
                              initial={{ width: 0 }}
                              animate={{ width: `${barW}%` }}
                              transition={{ duration: 1.2, delay: 0.5 + (i * 0.1), type: "spring", bounce: 0.3 }}
                              className="h-full rounded-full relative"
                              style={{ background: `linear-gradient(90deg, ${color} 0%, ${color}ee 100%)` }}
                            >
                              <div className="absolute inset-0 bg-white/20 dark:bg-white/10 w-full h-full" style={{ mixBlendMode: "overlay" }} />
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
