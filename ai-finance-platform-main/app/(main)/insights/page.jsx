"use client";

import { useEffect, useState, useCallback } from "react";
import { getBehaviorAnalysis } from "@/actions/behavior-analyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarLoader } from "react-spinners";
import {
  BrainCircuit, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, Info, Lightbulb, RefreshCw, Sparkles, Target,
  Flame, ShieldCheck, User2, Wallet, BarChart3, Zap,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function HealthRing({ score, label }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#6366f1" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg className="rotate-[-90deg]" width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={r} strokeWidth="14" stroke="#e2e8f0" fill="none" className="dark:stroke-slate-700" />
          <circle cx="80" cy="80" r={r} strokeWidth="14" stroke={color} fill="none"
            strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-slate-900 dark:text-white">{score}</span>
          <span className="text-xs font-semibold text-slate-400">/100</span>
        </div>
      </div>
      <span className="text-sm font-bold px-5 py-1.5 rounded-full" style={{ backgroundColor: color + "22", color }}>
        {label}
      </span>
    </div>
  );
}

function SeverityIcon({ severity }) {
  if (severity === "positive") return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />;
  if (severity === "warning")  return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />;
  return <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />;
}

function ImpactBadge({ impact }) {
  const styles = {
    High:   "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    Low:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  };
  return (
    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[impact] || styles.Low}`}>
      {impact} Impact
    </span>
  );
}

function TrendBadge({ direction, velocity }) {
  if (direction === "up")
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
          <TrendingUp className="h-3 w-3" /> Rising
        </span>
        {velocity && <span className="text-xs text-slate-400 font-medium">{velocity}</span>}
      </div>
    );
  if (direction === "down")
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          <TrendingDown className="h-3 w-3" /> Falling
        </span>
        {velocity && <span className="text-xs text-slate-400 font-medium">{velocity}</span>}
      </div>
    );
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
        <Minus className="h-3 w-3" /> Stable
      </span>
      {velocity && <span className="text-xs text-slate-400 font-medium">{velocity}</span>}
    </div>
  );
}

const PRIORITY_STYLES = {
  high:   { border: "border-l-4 border-rose-500",    bg: "bg-rose-50 dark:bg-rose-950/20",    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",    icon: <Flame className="h-4 w-4 text-rose-500" />,    label: "High" },
  medium: { border: "border-l-4 border-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",   icon: <Target className="h-4 w-4 text-amber-500" />,   label: "Medium" },
  low:    { border: "border-l-4 border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, label: "Low" },
};

const BUDGET_STATUS_STYLES = {
  "On Track":     { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500" },
  "Warning":      { color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/30",   dot: "bg-amber-500" },
  "Over Budget":  { color: "text-rose-600",    bg: "bg-rose-50 dark:bg-rose-950/30",    dot: "bg-rose-500" },
  "No Budget Set":{ color: "text-slate-500",   bg: "bg-slate-100 dark:bg-slate-800",    dot: "bg-slate-400" },
};

const CAT_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4","#f97316","#14b8a6","#64748b"];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await getBehaviorAnalysis(forceRefresh);
      if (result && typeof result === "object") { setData(result); setError(null); }
      else setError("Unexpected response from AI. Please try again.");
    } catch (err) {
      setError(err?.message || String(err) || "Unknown error");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(false); }, [fetchData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <BrainCircuit className="h-16 w-16 text-indigo-400 animate-pulse" />
      <BarLoader width={220} color="#6366f1" />
      <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm animate-pulse">
        SAMPAT AI is analyzing your financial behavior…
      </p>
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-8 max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full border-rose-200 dark:border-rose-900/50 shadow-2xl rounded-3xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 to-rose-600" />
        <CardContent className="p-8 space-y-5">
          <p className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> AI Insight Error</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl">{error}</p>
          <Button onClick={() => fetchData(true)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (!data || data.empty) return (
    <div className="container mx-auto px-4 py-8 max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full border-indigo-100 dark:border-indigo-900/40 shadow-2xl rounded-3xl overflow-hidden text-center">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 to-violet-600" />
        <CardContent className="p-10 space-y-4">
          <BrainCircuit className="h-16 w-16 text-indigo-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Data Yet</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{data?.message || "Add transactions to unlock AI insights."}</p>
        </CardContent>
      </Card>
    </div>
  );

  const { structured: s, categoryTotals, totalSpend, budgetAmount } = data;
  const cats = Object.entries(categoryTotals || {}).sort((a, b) => b[1] - a[1]);
  const budgetStyle = BUDGET_STATUS_STYLES[s?.budgetAnalysis?.status] || BUDGET_STATUS_STYLES["No Budget Set"];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8 animate-in fade-in duration-300 pb-20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <BrainCircuit className="h-9 w-9 text-indigo-600 dark:text-indigo-400" />
            AI Financial Insights
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Deep behavioral analysis powered by SAMPAT AI</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing}
          className="self-start sm:self-auto rounded-xl border-slate-200 dark:border-slate-700">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Analyzing…" : "Re-Analyze"}
        </Button>
      </div>

      {/* ── ROW 1: Health Score + Summary ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-white dark:bg-[#141B2D] rounded-3xl flex flex-col items-center justify-center p-8 gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Financial Health Score</p>
          <HealthRing score={s?.healthScore ?? 70} label={s?.healthLabel ?? "Good"} />
        </Card>
        <Card className="md:col-span-2 border-none shadow-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-3xl">
          <div className="p-8 space-y-5 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2 opacity-75">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-widest">Executive Summary</span>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed opacity-95">{s?.summary || "Your financial analysis is ready."}</p>
            <div className="flex gap-3 flex-wrap pt-1">
              <div className="bg-white/15 rounded-2xl px-4 py-2">
                <p className="text-xs opacity-60 uppercase tracking-wider">Total Spend</p>
                <p className="text-xl font-black">₹{(totalSpend || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
              </div>
              {budgetAmount && (
                <div className="bg-white/15 rounded-2xl px-4 py-2">
                  <p className="text-xs opacity-60 uppercase tracking-wider">Budget Used</p>
                  <p className="text-xl font-black">{((totalSpend / budgetAmount) * 100).toFixed(0)}%</p>
                </div>
              )}
              <div className="bg-white/15 rounded-2xl px-4 py-2">
                <p className="text-xs opacity-60 uppercase tracking-wider">Categories</p>
                <p className="text-xl font-black">{cats.length}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── ROW 2: Behavioral Profile + Budget Analysis ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Behavioral Profile */}
        <Card className="border border-slate-200 dark:border-slate-800/80 shadow-xl bg-white dark:bg-[#141B2D] rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <User2 className="h-5 w-5 text-violet-500" /> Behavioral Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {s?.behavioralProfile ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-bold px-4 py-1.5 rounded-full">
                    {s.behavioralProfile.type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.behavioralProfile.description}</p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-3 border-l-4 border-emerald-500">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Strength</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{s.behavioralProfile.strength}</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl p-3 border-l-4 border-rose-500">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">Weakness</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{s.behavioralProfile.weakness}</p>
                  </div>
                </div>
              </>
            ) : <p className="text-slate-400 text-sm">Profile unavailable.</p>}
          </CardContent>
        </Card>

        {/* Budget Analysis */}
        <Card className="border border-slate-200 dark:border-slate-800/80 shadow-xl bg-white dark:bg-[#141B2D] rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <Wallet className="h-5 w-5 text-blue-500" /> Budget Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {s?.budgetAnalysis ? (
              <>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${budgetStyle.bg} ${budgetStyle.color}`}>
                  <span className={`w-2 h-2 rounded-full ${budgetStyle.dot}`} />
                  {s.budgetAnalysis.status}
                </div>
                {budgetAmount && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>₹{(totalSpend || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} spent</span>
                      <span>₹{budgetAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })} budget</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (totalSpend / budgetAmount) * 100)}%`,
                          backgroundColor: budgetStyle.dot.replace("bg-", "") === "rose-500" ? "#ef4444" : budgetStyle.dot.replace("bg-", "") === "amber-500" ? "#f59e0b" : "#22c55e"
                        }} />
                    </div>
                  </div>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.budgetAnalysis.commentary}</p>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-3 border-l-4 border-blue-500">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Suggestion</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{s.budgetAnalysis.suggestion}</p>
                </div>
              </>
            ) : <p className="text-slate-400 text-sm">Budget data unavailable.</p>}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW 3: Spending Patterns + Trends ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patterns */}
        <Card className="border border-slate-200 dark:border-slate-800/80 shadow-xl bg-white dark:bg-[#141B2D] rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <BrainCircuit className="h-5 w-5 text-indigo-500" /> Spending Patterns
              <span className="ml-auto text-xs font-medium text-slate-400 normal-case">{(s?.patterns || []).length} patterns detected</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {(s?.patterns || []).length === 0 ? (
              <p className="text-slate-400 text-sm">No patterns detected yet.</p>
            ) : s.patterns.map((p, i) => (
              <div key={i} className="flex gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                <SeverityIcon severity={p.severity} />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{p.title}</p>
                    {p.impact && <ImpactBadge impact={p.impact} />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.description}</p>
                  {p.dataPoint && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl px-3 py-1.5 mt-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Data Point</p>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{p.dataPoint}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trends */}
        <Card className="border border-slate-200 dark:border-slate-800/80 shadow-xl bg-white dark:bg-[#141B2D] rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <Zap className="h-5 w-5 text-amber-500" /> Trend Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {(s?.trends || []).length === 0 ? (
              <p className="text-slate-400 text-sm">Not enough data to detect trends.</p>
            ) : s.trends.map((t, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{t.label}</p>
                  <TrendBadge direction={t.direction} velocity={t.velocity} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW 4: Actionable Tips ────────────────────────────────────────── */}
      <Card className="border border-slate-200 dark:border-slate-800/80 shadow-xl bg-white dark:bg-[#141B2D] rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Lightbulb className="h-5 w-5 text-amber-500" /> Actionable Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(s?.tips || []).length === 0 ? (
            <p className="text-slate-400 text-sm col-span-3">No recommendations available yet.</p>
          ) : s.tips.map((tip, i) => {
            const style = PRIORITY_STYLES[tip.priority] || PRIORITY_STYLES.low;
            return (
              <div key={i} className={`rounded-2xl p-5 space-y-3 ${style.border} ${style.bg}`}>
                <div className="flex items-center gap-2">
                  {style.icon}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>{style.label} Priority</span>
                </div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{tip.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{tip.action}</p>
                {tip.estimatedSaving && (
                  <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl px-3 py-1.5 mt-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Est. Saving</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{tip.estimatedSaving}/mo</p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── ROW 5: Category Deep-Dives ────────────────────────────────────── */}
      {(s?.categoryInsights || []).length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800/80 shadow-xl bg-white dark:bg-[#141B2D] rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <BarChart3 className="h-5 w-5 text-blue-500" /> Category Deep-Dive
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {s.categoryInsights.map((ci, i) => (
              <div key={i} className={`rounded-2xl p-5 space-y-3 border ${ci.isOverspending ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40"}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 capitalize">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                    {ci.category}
                  </span>
                  {ci.isOverspending && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-full shrink-0">Overspending</span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900 dark:text-white">{ci.amount}</span>
                  <span className="text-xs text-slate-400 font-medium">{ci.pct?.toFixed(1)}% of total</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, ci.pct || 0)}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{ci.insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── ROW 6: Full Category Breakdown ───────────────────────────────── */}
      <Card className="border border-slate-200 dark:border-slate-800/80 shadow-xl bg-white dark:bg-[#141B2D] rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-4">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Target className="h-5 w-5 text-indigo-500" /> Full Spending Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {cats.length === 0 ? (
            <p className="text-slate-400 text-sm">No expense categories found.</p>
          ) : cats.map(([cat, total], i) => {
            const pct = totalSpend > 0 ? ((total / totalSpend) * 100) : 0;
            const color = CAT_COLORS[i % CAT_COLORS.length];
            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="capitalize flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {cat}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">{pct.toFixed(1)}%</span>
                    <span className="font-bold">₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}
