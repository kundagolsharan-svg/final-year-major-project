"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  getUserSettings,
  updateUserProfile,
  exportAllUserData,
  clearAICacheAction,
  deleteAllUserTransactions,
  updateNotificationPreferences,
} from "@/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  User,
  Bell,
  Sparkles,
  Download,
  Trash2,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  Target,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  HardDrive,
  Activity,
  LogIn,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userSettings, setUserSettings] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState(true);
  const [billReminders, setBillReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [autoReceiptScan, setAutoReceiptScan] = useState(true);

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserSettings();
      if (res.success && res.data) {
        setUserSettings(res.data);
        setName(res.data.name || "");
        setBudgetAlerts(res.data.budgetAlerts ?? true);
        setFraudAlerts(res.data.fraudAlerts ?? true);
        setBillReminders(res.data.billReminders ?? true);
        setWeeklyDigest(res.data.weeklyDigest ?? false);
      } else {
        toast.error(res.error || "Failed to load user settings");
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleTogglePreference = async (key, value) => {
    // Optimistic local update
    if (key === "budgetAlerts") setBudgetAlerts(value);
    if (key === "fraudAlerts") setFraudAlerts(value);
    if (key === "billReminders") setBillReminders(value);
    if (key === "weeklyDigest") setWeeklyDigest(value);

    try {
      const newPrefs = {
        budgetAlerts,
        fraudAlerts,
        billReminders,
        weeklyDigest,
        [key]: value,
      };
      
      const res = await updateNotificationPreferences(newPrefs);
      if (res.success) {
        toast.success("Preferences updated");
      } else {
        toast.error(res.error || "Failed to update preferences");
        fetchSettings(); // Revert on failure
      }
    } catch (error) {
      toast.error("An error occurred");
      fetchSettings(); // Revert on failure
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a valid name");
      return;
    }
    setSaving(true);
    try {
      const res = await updateUserProfile({ name: name.trim() });
      if (res.success) {
        toast.success(res.message || "Profile updated successfully");
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred while updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleClearAICache = async () => {
    try {
      const res = await clearAICacheAction();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error || "Failed to clear AI cache");
      }
    } catch (error) {
      toast.error("Failed to clear AI cache");
    }
  };

  const handleExportData = async () => {
    try {
      const res = await exportAllUserData();
      if (res.success && res.data) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(res.data, null, 2)
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute(
          "download",
          `sampat_finance_export_${new Date().toISOString().split("T")[0]}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success("Financial data exported successfully");
      } else {
        toast.error(res.error || "Failed to export data");
      }
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const handleDeleteAllTransactions = async () => {
    setDeleting(true);
    try {
      const res = await deleteAllUserTransactions();
      if (res.success) {
        toast.success(res.message);
        setShowDeleteConfirm(false);
        fetchSettings();
      } else {
        toast.error(res.error || "Failed to clear data");
      }
    } catch (error) {
      toast.error("Failed to clear transaction data");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-medium text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Account Settings & Preferences
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage your personal profile, alert rules, AI configuration, and financial data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            className="rounded-xl border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Accounts</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {userSettings?.accountCount || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CreditCard size={20} />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recorded Transactions</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {userSettings?.transactionCount || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Receipt size={20} />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Goals</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {userSettings?.goalCount || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Target size={20} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Profile & Identity */}
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Profile Details
            </CardTitle>
            <CardDescription>Update your display name and view account email.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Display Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-sm">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{userSettings?.email}</span>
                  <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={14} />
                    Verified
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Primary Currency</label>
                <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-sm font-semibold text-slate-900 dark:text-white">
                  ₹ INR (Indian Rupee)
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {saving ? "Saving Changes..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Section 2: Notifications & Smart Alerts */}
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Notifications & Alerts
            </CardTitle>
            <CardDescription>Configure smart notifications and threshold alerts.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Budget Overrun Alerts</p>
                <p className="text-xs text-slate-500">Alert when spending crosses 80% of your monthly budget</p>
              </div>
              <Switch checked={budgetAlerts} onCheckedChange={(val) => handleTogglePreference("budgetAlerts", val)} />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Fraud & Anomaly Alerts</p>
                <p className="text-xs text-slate-500">Flag unusual transactions and double-charges immediately</p>
              </div>
              <Switch checked={fraudAlerts} onCheckedChange={(val) => handleTogglePreference("fraudAlerts", val)} />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Recurring Bill Reminders</p>
                <p className="text-xs text-slate-500">Notify 3 days before subscriptions or bills are due</p>
              </div>
              <Switch checked={billReminders} onCheckedChange={(val) => handleTogglePreference("billReminders", val)} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Weekly Summary Digest</p>
                <p className="text-xs text-slate-500">Receive a weekly AI breakdown of savings and cash flow</p>
              </div>
              <Switch checked={weeklyDigest} onCheckedChange={(val) => handleTogglePreference("weeklyDigest", val)} />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: AI Engine & Intelligence Cache */}
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              AI Intelligence & Memory
            </CardTitle>
            <CardDescription>Manage local AI models, caching, and smart scanner features.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Auto-Scan Receipts</p>
                <p className="text-xs text-slate-500">Use vision model to extract merchant, total, and tax category</p>
              </div>
              <Switch checked={autoReceiptScan} onCheckedChange={setAutoReceiptScan} />
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Local AI Engine:</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
                  Ollama / Gemini Fallback Active
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                SAMPAT AI accelerates your queries using in-memory response caching for instantaneous navigation.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleClearAICache}
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear AI Response Cache
            </Button>
          </CardContent>
        </Card>

        {/* Section 4: Data Export & Backup */}
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Data & Export
            </CardTitle>
            <CardDescription>Export complete statements and offline backup.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Export your entire account history including transactions, categories, budgets, and savings goals in standardized JSON format for taxes or personal backup.
            </p>

            <Button
              onClick={handleExportData}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Full Financial Data (JSON)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Logs */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-6">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            System & Security Logs
          </CardTitle>
          <CardDescription>Recent login and logout activity for your account.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
            {userSettings?.systemLogs?.length > 0 ? (
              userSettings.systemLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${log.action === "LOGIN" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                      {log.action === "LOGIN" ? <LogIn size={16} /> : <LogOut size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {log.action === "LOGIN" ? "Signed In" : "Signed Out"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(log.timestamp), "MMM dd, yyyy • hh:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Success
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                No recent activity logs found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-3xl border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-rose-100 dark:border-rose-900/30">
          <CardTitle className="text-base font-black text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-rose-600/80 dark:text-rose-400/80">
            Irreversible account actions and data resetting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Clear All Transactions</p>
              <p className="text-xs text-slate-500">
                Permanently delete all recorded income and expense transactions and reset balances to zero.
              </p>
            </div>

            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-xl font-bold self-start sm:self-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Transactions
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={handleDeleteAllTransactions}
                  className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700"
                >
                  {deleting ? "Clearing..." : "Yes, Permanently Clear"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
