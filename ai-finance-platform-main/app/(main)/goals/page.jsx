"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGoals,
  createGoal,
  updateGoal,
  contributeToGoal,
  deleteGoal,
  getGoalPlan,
} from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Trash2,
  Calendar,
  Plus,
  LayoutList,
  Sparkles,
  Loader2,
  Trophy,
  AlertTriangle,
  X,
  TrendingUp,
  Coins,
  CheckCircle2,
  Clock,
  Edit3,
  Flame,
  ShieldCheck,
  Plane,
  Car,
  Laptop,
  PiggyBank,
  HeartHandshake,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const PRESET_TEMPLATES = [
  {
    name: "Emergency Safety Net (3 Months)",
    targetAmount: "75000",
    icon: ShieldCheck,
    months: 6,
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "Vacation & Travel Adventure",
    targetAmount: "45000",
    icon: Plane,
    months: 4,
    color: "from-amber-500 to-orange-600",
  },
  {
    name: "New Vehicle / Bike Down Payment",
    targetAmount: "120000",
    icon: Car,
    months: 12,
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "Tech & Workstation Upgrade",
    targetAmount: "90000",
    icon: Laptop,
    months: 5,
    color: "from-purple-500 to-pink-600",
  },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Form & Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [depositGoal, setDepositGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Plan
  const [plan, setPlan] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [activePlanGoalId, setActivePlanGoalId] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
  });

  const fetchGoals = async () => {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const completedCount = goals.filter((g) => g.isCompleted).length;
    const overallProgress =
      totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    return {
      totalTarget,
      totalSaved,
      completedCount,
      activeCount: goals.length - completedCount,
      overallProgress,
    };
  }, [goals]);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    if (filter === "completed") return goals.filter((g) => g.isCompleted);
    if (filter === "active") return goals.filter((g) => !g.isCompleted);
    return goals;
  }, [goals, filter]);

  const handleApplyPreset = (preset) => {
    const deadlineDate = new Date();
    deadlineDate.setMonth(deadlineDate.getMonth() + preset.months);
    setFormData({
      name: preset.name,
      targetAmount: preset.targetAmount,
      currentAmount: "0",
      deadline: deadlineDate.toISOString().split("T")[0],
    });
    setShowAdd(true);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.targetAmount) {
      toast.error("Please provide a goal name and target amount");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, formData);
        toast.success("Goal updated successfully!");
      } else {
        await createGoal(formData);
        toast.success("New goal created! AI is ready to help you achieve it.");
      }
      setFormData({ name: "", targetAmount: "", currentAmount: "", deadline: "" });
      setShowAdd(false);
      setEditingGoal(null);
      fetchGoals();
    } catch (e) {
      toast.error(e.message || "Failed to save goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : "",
    });
    setShowAdd(true);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleDepositFunds = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await contributeToGoal(depositGoal.id, amt);
      toast.success(res.message || "Funds deposited successfully!");
      setDepositGoal(null);
      setDepositAmount("");
      fetchGoals();
    } catch (err) {
      toast.error(err.message || "Failed to deposit funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this goal?")) return;
    try {
      await deleteGoal(id);
      toast.success("Goal removed.");
      fetchGoals();
    } catch (e) {
      toast.error("Failed to delete goal");
    }
  };

  const handleGetPlan = async (id) => {
    setIsPlanning(true);
    setActivePlanGoalId(id);
    setPlan(null);
    setError(null);
    try {
      const planRes = await getGoalPlan(id);
      setPlan(planRes);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (e) {
      console.error("Failed to generate goal plan", e);
      setError(e.message);
      toast.error("AI couldn't generate a plan right now.");
    } finally {
      setIsPlanning(false);
      setActivePlanGoalId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading your financial goals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Target className="h-7 w-7" />
            </div>
            Financial Goals & Savings Targets
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track milestones, automate monthly SIP calculations, and let AI generate tactical roadmaps.
          </p>
        </div>

        <Button
          onClick={() => {
            if (showAdd) {
              setShowAdd(false);
              setEditingGoal(null);
            } else {
              setFormData({ name: "", targetAmount: "", currentAmount: "", deadline: "" });
              setShowAdd(true);
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-2xl shadow-md shadow-indigo-500/20 flex items-center gap-2"
        >
          {showAdd ? (
            <>
              <X size={18} /> Cancel
            </>
          ) : (
            <>
              <Plus size={18} /> Create New Goal
            </>
          )}
        </Button>
      </div>

      {/* ── Portfolio Overview KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0f] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Saved</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{summary.totalSaved.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Coins size={22} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm font-bold text-slate-500 mb-1">
              <span>Overall Progress</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                {summary.overallProgress}%
              </span>
            </div>
            <Progress value={summary.overallProgress} className="h-2 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0f] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Target</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ₹{summary.totalTarget.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-3">
            Across {goals.length} portfolio targets
          </p>
        </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.3 }}>
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0f] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Goals</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {summary.activeCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-3">In active accumulation</p>
        </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }} transition={{ duration: 0.5, delay: 0.4 }}>
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0f] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Goals Achieved</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {summary.completedCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Trophy size={22} />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-3">100% Milestone reached 🎉</p>
        </Card>
        </motion.div>
      </div>

      {/* ── Preset Templates Quick Bar ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Quick Preset Goal Blueprints
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleApplyPreset(tpl)}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0f] hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-md transition-all text-left group"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-tr text-white flex items-center justify-center shrink-0 shadow-sm",
                  tpl.color
                )}
              >
                <tpl.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {tpl.name}
                </p>
                <p className="text-sm font-semibold text-slate-500">
                  ₹{Number(tpl.targetAmount).toLocaleString("en-IN")} • {tpl.months} mos
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Add / Edit Goal Form ── */}
      {showAdd && (
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0f] shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-300" />
              {editingGoal ? "Edit Financial Goal" : "Configure New Savings Goal"}
            </CardTitle>
            <CardDescription className="text-indigo-100 text-xs">
              Define your target amount and timeframe. SAMPAT AI will calculate your required daily/monthly pace.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Goal Name
                  </label>
                  <Input
                    placeholder="e.g. New Car Down Payment"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Amount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Initial / Current Savings (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Deadline
                  </label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAdd(false);
                    setEditingGoal(null);
                  }}
                  className="rounded-xl border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingGoal
                    ? "Update Goal"
                    : "Initialize Goal"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Deposit Funds Modal / Drawer ── */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0f] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Coins size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Contribute Savings
                  </h3>
                  <p className="text-xs text-slate-500">{depositGoal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setDepositGoal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Deposit Amount (₹)
              </label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="rounded-xl text-lg font-bold border-slate-200 dark:border-slate-700"
                autoFocus
              />

              {/* Quick preset amount chips */}
              <div className="flex gap-2 flex-wrap pt-1">
                {[500, 1000, 2500, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt.toString())}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    +₹{amt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDepositGoal(null)}
                className="rounded-xl border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDepositFunds}
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isSubmitting ? "Depositing..." : "Confirm Deposit"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── AI Strategy Roadmap Display ── */}
      {plan && (
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0f] shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Trophy className="h-64 w-64 text-indigo-500" />
          </div>
          <CardHeader className="p-8 pb-4 flex flex-row justify-between items-start border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <Sparkles size={14} />
                SAMPAT AI Financial Roadmap
              </div>
              <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
                Personalized Goal Strategy
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPlan(null)}
              className="rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none prose-headings:text-indigo-600 dark:prose-headings:text-indigo-400 prose-headings:font-bold prose-strong:text-indigo-600 dark:prose-strong:text-indigo-300 text-sm leading-relaxed">
            <ReactMarkdown>{plan}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {/* ── Filters & Goals Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filter === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              All Goals ({goals.length})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filter === "active"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              In Progress ({summary.activeCount})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filter === "completed"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              Achieved ({summary.completedCount})
            </button>
          </div>
        </div>

        {/* Grid of Goal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal, index) => {
            const isCompleted = goal.isCompleted;
            const progress = goal.progressPercent;

            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <Card
                className={cn(
                  "rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white dark:bg-[#0a0a0f] flex flex-col justify-between overflow-hidden relative",
                  isCompleted
                    ? "border-emerald-300 dark:border-emerald-500/40 shadow-emerald-500/5"
                    : "border-slate-200 dark:border-slate-800"
                )}
              >
                {/* Top decorative gradient bar */}
                <div
                  className={cn(
                    "h-2 w-full",
                    isCompleted
                      ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                      : "bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"
                  )}
                />

                <CardHeader className="p-6 pb-3">
                  <div className="flex justify-between items-start">
                    <div
                      className={cn(
                        "p-3 rounded-2xl flex items-center justify-center",
                        isCompleted
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                      )}
                    >
                      {isCompleted ? <Trophy size={24} /> : <Target size={24} />}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(goal)}
                        title="Edit Goal"
                        className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <Edit3 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                        title="Delete Goal"
                        className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>

                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mt-4 line-clamp-1">
                    {goal.name}
                  </CardTitle>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    <Calendar size={13} className="text-indigo-500" />
                    {goal.deadline
                      ? `Due: ${new Date(goal.deadline).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}`
                      : "No deadline"}
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-2 space-y-4">
                  {/* Progress Numbers */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Saved
                        </span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                          ₹{goal.currentAmount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Target
                        </span>
                        <p className="text-sm font-extrabold text-slate-500 dark:text-slate-400">
                          ₹{goal.targetAmount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <Progress
                      value={progress}
                      className={cn(
                        "h-2.5 rounded-full bg-slate-100 dark:bg-slate-800",
                        isCompleted && "[&>div]:bg-emerald-500"
                      )}
                    />

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        {progress}% Completed
                      </span>
                      {isCompleted ? (
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Achieved!
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">
                          ₹{goal.remainingAmount.toLocaleString("en-IN")} left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Smart SIP / Pace Calculator Box */}
                  {!isCompleted && goal.deadline && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Required SIP Pace:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                          ₹{goal.monthlySavingNeeded?.toLocaleString("en-IN")}/mo
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Daily Pace:</span>
                        <span>₹{goal.dailySavingNeeded?.toLocaleString("en-IN")}/day ({goal.daysRemaining} days left)</span>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-6 pt-0 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button
                      onClick={() => {
                        setDepositGoal(goal);
                        setDepositAmount("");
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-10 shadow-sm"
                    >
                      <Coins size={14} className="mr-1.5" />
                      + Add Funds
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleGetPlan(goal.id)}
                      disabled={isPlanning && activePlanGoalId === goal.id}
                      className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold h-10"
                    >
                      {isPlanning && activePlanGoalId === goal.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Sparkles size={14} className="mr-1.5 text-indigo-500" />
                          AI Roadmap
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              </motion.div>
            );
          })}

          {filteredGoals.length === 0 && !showAdd && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center bg-white dark:bg-[#0a0a0f] p-8 space-y-3">
              <Target className="h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-base font-bold text-slate-900 dark:text-white">
                No Goals in this view
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Pick one of the preset templates above or create a custom goal to start saving.
              </p>
              <Button
                onClick={() => setShowAdd(true)}
                className="rounded-xl bg-indigo-600 text-white text-xs font-bold mt-2"
              >
                + Create Your First Goal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


