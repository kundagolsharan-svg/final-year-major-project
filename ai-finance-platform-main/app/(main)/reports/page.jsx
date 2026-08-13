"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getMonthlyReportData, getMonthlyReportAISummary } from "@/actions/reports";
import { downloadMonthlyReport, downloadReportCSV } from "@/lib/download-pdf";
import {
  FileDown,
  PieChart,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Loader2,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'tax' | 'ledger'
  const [searchQuery, setSearchQuery] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");

  const fetchReportData = useCallback(async (forceRefreshAI = false) => {
    setLoading(true);
    try {
      const result = await getMonthlyReportData(selectedMonth, selectedYear);
      if (result.success && result.data) {
        setReportData(result.data);

        // Fetch AI analysis if missing or explicitly refreshed
        if (!result.data.aiSummary || forceRefreshAI) {
          setAiLoading(true);
          getMonthlyReportAISummary(
            selectedMonth,
            selectedYear,
            result.data.totalIncome,
            result.data.totalExpenses,
            result.data.categoryBreakdown,
            result.data.taxBreakdown
          )
            .then((aiRes) => {
              if (aiRes.success && aiRes.aiSummary) {
                setReportData((prev) => (prev ? { ...prev, aiSummary: aiRes.aiSummary } : prev));
              }
            })
            .finally(() => {
              setAiLoading(false);
            });
        }
      } else {
        toast.error(result.error || "Failed to fetch report data");
      }
    } catch (error) {
      toast.error("An error occurred while fetching report data");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Derived metrics
  const netSavings = useMemo(() => {
    if (!reportData) return 0;
    return reportData.totalIncome - reportData.totalExpenses;
  }, [reportData]);

  const savingsRate = useMemo(() => {
    if (!reportData || reportData.totalIncome === 0) return 0;
    return Math.max(-100, Math.min(100, Math.round((netSavings / reportData.totalIncome) * 100)));
  }, [reportData, netSavings]);

  const savingsRating = useMemo(() => {
    if (savingsRate >= 40) return { label: "Elite Tier (40%+)", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" };
    if (savingsRate >= 20) return { label: "Healthy (20%+)", color: "text-blue-600 bg-blue-500/10 border-blue-500/30" };
    if (savingsRate >= 0) return { label: "Moderate Pace", color: "text-amber-600 bg-amber-500/10 border-amber-500/30" };
    return { label: "Cash Deficit", color: "text-rose-600 bg-rose-500/10 border-rose-500/30" };
  }, [savingsRate]);

  const filteredTransactions = useMemo(() => {
    if (!reportData || !reportData.transactions) return [];
    return reportData.transactions.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        txTypeFilter === "all" ||
        (txTypeFilter === "income" && t.type === "INCOME") ||
        (txTypeFilter === "expense" && t.type === "EXPENSE");
      return matchesSearch && matchesType;
    });
  }, [reportData, searchQuery, txTypeFilter]);

  const totalTaxDeductible = useMemo(() => {
    if (!reportData || !reportData.taxBreakdown) return 0;
    return Object.values(reportData.taxBreakdown).reduce((sum, v) => sum + Number(v), 0);
  }, [reportData]);

  const handleDownloadPDF = () => {
    if (!reportData) return;
    try {
      downloadMonthlyReport(reportData);
      toast.success("Executive PDF report downloaded");
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;
    try {
      downloadReportCSV(reportData);
      toast.success("CSV spreadsheet exported");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const handleSelectCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const handleSelectLastMonth = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* ── Top Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Receipt className="h-7 w-7" />
            </div>
            Financial Statements & Audit Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Official monthly P&L statements, tax deduction audit summaries, and AI financial analysis.
          </p>
        </div>

        {/* Date Filters & Download Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(parseInt(val))}
          >
            <SelectTrigger className="w-[135px] rounded-xl border-slate-200 dark:border-slate-700 font-bold text-xs">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, i) => (
                <SelectItem key={month} value={(i + 1).toString()} className="font-semibold text-xs">
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(val) => setSelectedYear(parseInt(val))}
          >
            <SelectTrigger className="w-[95px] rounded-xl border-slate-200 dark:border-slate-700 font-bold text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()} className="font-semibold text-xs">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleDownloadPDF}
            disabled={!reportData || loading}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-4 shadow-sm"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadCSV}
            disabled={!reportData || loading}
            className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold h-10 px-3.5"
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
            CSV
          </Button>
        </div>
      </div>

      {/* Quick Month Switchers */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Select:</span>
        <button
          onClick={handleSelectCurrentMonth}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
        >
          This Month
        </button>
        <button
          onClick={handleSelectLastMonth}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
        >
          Last Month
        </button>
      </div>

      {/* ── Executive 4-KPI Metric Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      ) : reportData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Inflow */}
          <Card className="rounded-3xl border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Total Inflow (Income)
                </p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  ₹{reportData.totalIncome.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <ArrowDownLeft size={22} />
              </div>
            </div>
            <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-3">
              Total credited receipts for {MONTHS[selectedMonth - 1]}
            </p>
          </Card>

          {/* Total Outflow */}
          <Card className="rounded-3xl border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Total Outflow (Spend)
                </p>
                <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                  ₹{reportData.totalExpenses.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                <ArrowUpRight size={22} />
              </div>
            </div>
            <p className="text-sm font-semibold text-rose-600/80 dark:text-rose-400/80 mt-3">
              Across {Object.keys(reportData.categoryBreakdown).length} spending categories
            </p>
          </Card>

          {/* Net Surplus / Savings */}
          <Card className="rounded-3xl border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                  Net Surplus / Savings
                </p>
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  {netSavings >= 0 ? "+" : ""}₹{netSavings.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                <Wallet size={22} />
              </div>
            </div>
            <p className="text-sm font-semibold text-indigo-600/80 dark:text-indigo-400/80 mt-3">
              {netSavings >= 0 ? "Positive financial surplus" : "Negative monthly cash balance"}
            </p>
          </Card>

          {/* Savings Rate & Efficiency */}
          <Card className="rounded-3xl border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Savings Rate
                </p>
                <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                  {savingsRate}%
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <PieChart size={22} />
              </div>
            </div>
            <div className="mt-3">
              <span className={cn("text-xs font-black px-2.5 py-0.5 rounded-full border", savingsRating.color)}>
                {savingsRating.label}
              </span>
            </div>
          </Card>
        </div>
      ) : null}

      {/* ── Structured Tab Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Layers size={15} />
          Executive Overview & AI
        </button>

        <button
          onClick={() => setActiveTab("tax")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === "tax"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <ShieldCheck size={15} />
          Tax & Deductions Audit
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === "ledger"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Receipt size={15} />
          Itemized Ledger ({reportData?.transactions?.length || 0})
        </button>
      </div>

      {/* ── TAB 1: Executive Overview & AI ── */}
      {activeTab === "overview" && reportData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* AI Financial Analysis Card */}
          <Card className="rounded-3xl border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-[#141B2D] shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
                      SAMPAT AI Financial Diagnosis
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Machine-learning money flow synthesis and actionable optimization roadmaps.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchReportData(true)}
                  disabled={aiLoading}
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <RefreshCw size={13} className={cn("mr-1.5", aiLoading && "animate-spin")} />
                  Refresh AI
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {reportData.aiSummary ? (
                <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed prose-headings:font-bold prose-headings:text-indigo-600 dark:prose-headings:text-indigo-400">
                  <ReactMarkdown>{reportData.aiSummary}</ReactMarkdown>
                </div>
              ) : aiLoading ? (
                <div className="space-y-3 py-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <Loader2 size={16} className="animate-spin" />
                    Generating in-depth AI financial analysis...
                  </div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-4/5" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-full" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-2/3" />
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic py-4">
                  No automated analysis available for this period. Click &quot;Refresh AI&quot; to synthesize.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Category Expenditure Breakdown */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart size={18} className="text-indigo-600" />
                Category Outflow Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Itemized ranking of monthly expenditure by category.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {Object.keys(reportData.categoryBreakdown).length > 0 ? (
                Object.entries(reportData.categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const pct =
                      reportData.totalExpenses > 0
                        ? Math.round((amount / reportData.totalExpenses) * 100)
                        : 0;
                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="capitalize text-slate-800 dark:text-slate-200">
                            {category}
                          </span>
                          <span className="text-slate-900 dark:text-white">
                            ₹{amount.toLocaleString("en-IN")}{" "}
                            <span className="text-slate-400 font-semibold">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No expense records logged in {MONTHS[selectedMonth - 1]} {selectedYear}.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 2: Tax & Deductions Audit ── */}
      {activeTab === "tax" && reportData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-600" />
                  Tax-Relevant Expenditure Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Categorized transactions qualifying for potential deductions (Section 80C, Health, Rent, Business).
                </p>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-right">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Total Tax-Deductible Spend
                </span>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  ₹{totalTaxDeductible.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.keys(reportData.taxBreakdown).length > 0 ? (
                Object.entries(reportData.taxBreakdown).map(([tag, amt]) => (
                  <div
                    key={tag}
                    className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <span className="capitalize font-bold text-sm text-slate-900 dark:text-white">
                        {tag}
                      </span>
                      <p className="text-sm text-slate-500">Tax compliance deduction tag</p>
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      ₹{amt.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <ShieldCheck size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                    No Tax-Tagged Transactions
                  </p>
                  <p>When recording transactions, assign tax categories like 80C or Medical to see audit summaries here.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 3: Itemized Ledger ── */}
      {activeTab === "ledger" && reportData && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#141B2D] p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl text-xs h-9 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center gap-1.5 self-stretch sm:self-auto">
              <button
                onClick={() => setTxTypeFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  txTypeFilter === "all"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                All ({reportData.transactions.length})
              </button>
              <button
                onClick={() => setTxTypeFilter("income")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  txTypeFilter === "income"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                Inflow Only
              </button>
              <button
                onClick={() => setTxTypeFilter("expense")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  txTypeFilter === "expense"
                    ? "bg-rose-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                Outflow Only
              </button>
            </div>
          </div>

          {/* Ledger Table Card */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 pl-6">Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Tax Tag</th>
                    <th className="p-4 pr-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => {
                      const isIncome = t.type === "INCOME";
                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-4 pl-6 font-medium text-slate-500 whitespace-nowrap">
                            {new Date(t.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">
                            {t.description || "General Transaction"}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                              {t.category || "General"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">
                            {t.taxCategory ? (
                              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                {t.taxCategory}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-4 pr-6 text-right font-black text-sm whitespace-nowrap">
                            <span
                              className={isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
                            >
                              {isIncome ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN")}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                        No transactions match your search filter for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
