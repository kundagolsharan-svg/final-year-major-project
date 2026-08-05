"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Trash2,
  Filter,
  Check,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getRealAlerts } from "@/actions/alerts";

export function AlertsView() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRealAlerts();
      if (res.success && res.data) {
        setAlerts(res.data);
      } else {
        toast.error(res.error || "Failed to load alerts");
      }
    } catch (err) {
      toast.error("Failed to load real-time alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "unread") return !a.read;
    if (filter === "warning") return a.severity === "warning" || a.severity === "danger";
    if (filter === "info") return a.severity === "info" || a.severity === "success";
    return true;
  });

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleDismiss = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.info("Alert dismissed");
  };

  const handleToggleRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: !a.read } : a))
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 dark:from-amber-950/30 dark:via-purple-950/30 dark:to-blue-950/30 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20">
              <Bell size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Financial Alerts & Signals
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/30">
                {unreadCount} Active
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Live database triggers for budget overruns, large transactions, subscription schedules, and milestone targets.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={loadAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-750 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <Check size={14} />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
            filter === "all"
              ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20"
              : "bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
          )}
        >
          All Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
            filter === "unread"
              ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20"
              : "bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
          )}
        >
          Active ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("warning")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
            filter === "warning"
              ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20"
              : "bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
          )}
        >
          Warnings & Limits
        </button>
        <button
          onClick={() => setFilter("info")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
            filter === "info"
              ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20"
              : "bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
          )}
        >
          Updates & Goals
        </button>
      </div>

      {/* ── Alert Cards List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Checking real-time financial triggers...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredAlerts.length === 0 ? (
              <div className="bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                <p className="font-bold text-slate-900 dark:text-white text-base">You are all caught up!</p>
                <p className="text-sm">No active alerts matching your current filter.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isDanger = alert.severity === "danger";
                const isWarning = alert.severity === "warning";
                const isSuccess = alert.severity === "success";

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col sm:flex-row sm:items-start justify-between gap-4",
                      alert.read
                        ? "bg-white dark:bg-[#141B2D] border-slate-200 dark:border-slate-800/80"
                        : "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5",
                          isDanger
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : isWarning
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : isSuccess
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        )}
                      >
                        {isDanger ? (
                          <ShieldAlert size={22} />
                        ) : isWarning ? (
                          <AlertTriangle size={22} />
                        ) : isSuccess ? (
                          <Sparkles size={22} />
                        ) : (
                          <Info size={22} />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {alert.title}
                          </h3>
                          {!alert.read && (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                          )}
                          <span className="text-xs text-slate-400 font-semibold">
                            {alert.time}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                          {alert.message}
                        </p>

                        {alert.actionUrl && (
                          <div className="pt-2">
                            <Link
                              href={alert.actionUrl}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:underline"
                            >
                              {alert.actionLabel}
                              <ArrowRight size={14} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                      <button
                        onClick={() => handleToggleRead(alert.id)}
                        title={alert.read ? "Mark as unread" : "Mark as read"}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Check size={18} className={alert.read ? "text-emerald-500" : ""} />
                      </button>
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        title="Dismiss alert"
                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
