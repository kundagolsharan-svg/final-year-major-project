"use client";

import { useState, useMemo, useId, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  PieChart as PieChartIcon, 
  Trash2, 
  Search, 
  Filter, 
  CreditCard, 
  Receipt,
  CheckCircle,
  Clock,
  AlertOctagon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import StatementUpload from "@/components/StatementUpload";
import { bulkDeleteTransactions } from "@/actions/account";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLORS = [
  "#3B82F6", // Accent Blue
  "#8B5CF6", // Accent Purple
  "#22C55E", // Income Green
  "#EF4444", // Expense Red
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#EC4899", // Pink
];

export function DashboardOverview({ accounts, transactions }) {
  const rawId = useId();
  const chartId = useMemo(() => rawId.replace(/:/g, ""), [rawId]);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts?.find((a) => a.isDefault)?.id || accounts?.[0]?.id
  );
  const [localTransactions, setLocalTransactions] = useState(transactions || []);

  // Tabs for the 4 charts
  const [activeChartTab, setActiveChartTab] = useState("area");

  // Transactions table states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, INCOME, EXPENSE
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sync local state when prop changes
  useEffect(() => {
    setLocalTransactions(transactions || []);
  }, [transactions]);

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setLocalTransactions((prev) => prev.filter((t) => t.id !== id));
      deleteFn([id]);
    }
  };

  useEffect(() => {
    if (deleted?.success && !deleteLoading) {
      toast.success("Transaction deleted successfully");
      router.refresh();
    }
  }, [deleted, deleteLoading]);

  // Filter transactions for selected account with safety
  const accountTransactions = useMemo(() => 
    (localTransactions || []).filter((t) => t.accountId === selectedAccountId),
    [localTransactions, selectedAccountId]
  );

  // Extract unique categories for filtering
  const categoriesList = useMemo(() => {
    const list = new Set();
    accountTransactions.forEach(t => {
      if (t.category) list.add(t.category);
    });
    return Array.from(list);
  }, [accountTransactions]);

  // Filter & Search transactions for the list
  const processedTransactionsList = useMemo(() => {
    return accountTransactions
      .filter((t) => {
        const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          t.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || t.type === filterType;
        const matchesCategory = filterCategory === "all" || t.category === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [accountTransactions, searchQuery, filterType, filterCategory]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedTransactionsList.slice(startIndex, startIndex + itemsPerPage);
  }, [processedTransactionsList, currentPage]);

  const totalPages = Math.ceil(processedTransactionsList.length / itemsPerPage);

  // Calculate expense breakdown safely
  const pieChartData = useMemo(() => {
    const currentDate = new Date();
    const currentMonthExpenses = accountTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.type === "EXPENSE" &&
        transactionDate.getMonth() === currentDate.getMonth() &&
        transactionDate.getFullYear() === currentDate.getFullYear()
      );
    });

    const expensesByCategory = currentMonthExpenses.reduce((acc, transaction) => {
      const category = transaction.category || "other-expense";
      acc[category] = (acc[category] || 0) + (Number(transaction.amount) || 0);
      return acc;
    }, {});

    return Object.entries(expensesByCategory).map(([category, amount]) => ({
      name: category,
      value: amount,
    }));
  }, [accountTransactions]);

  // Calculate daily comparisons and savings for Last 7 Days
  const barChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(startOfDay(new Date()), i);
      return {
        date,
        label: format(date, "EEE"),
        income: 0,
        expense: 0,
        savings: 0,
      };
    }).reverse();

    accountTransactions.forEach((t) => {
      const transDate = startOfDay(new Date(t.date));
      const dayEntry = last7Days.find((d) => isSameDay(d.date, transDate));
      if (dayEntry) {
        if (t.type === "EXPENSE") {
          dayEntry.expense += (Number(t.amount) || 0);
        } else {
          dayEntry.income += (Number(t.amount) || 0);
        }
      }
    });

    // Compute savings
    last7Days.forEach(d => {
      d.savings = d.income - d.expense;
    });

    return last7Days;
  }, [accountTransactions]);

  // Calculate monthly summary
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = accountTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = currentMonth
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const expense = currentMonth
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return { income, expense, savings: income - expense };
  }, [accountTransactions]);

  // Reset page when queries change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterCategory]);

  if (!accounts || accounts.length === 0) {
    return (
      <Card className="border-none shadow-xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border-white/10 p-8 text-center rounded-[2rem]">
        <CardTitle className="mb-4 text-slate-900 dark:text-white">Welcome to SAMPAT AI</CardTitle>
        <p className="text-slate-500 dark:text-slate-400">Please create an account to start tracking your finances.</p>
      </Card>
    );
  }

  // Helper to resolve mock status icons and badge styles
  const getStatusDetails = (status) => {
    switch (status) {
      case "COMPLETED":
        return { icon: CheckCircle, className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
      case "PENDING":
        return { icon: Clock, className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
      case "FAILED":
        return { icon: AlertOctagon, className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" };
      default:
        return { icon: CheckCircle, className: "bg-emerald-500/10 text-emerald-400" };
    }
  };

  // Helper to mock Payment Method based on account/type/amounts
  const getPaymentMethod = (t) => {
    if (t.isRecurring) return "Auto-Debit";
    if (Number(t.amount) > 10000) return "Net Banking";
    if (Number(t.amount) < 2000) return "UPI";
    return "Debit Card";
  };

  return (
    <div className="space-y-6">
      {/* AI Statement Import Section */}
      <Card className="border-none shadow-2xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 overflow-hidden rounded-[2.5rem] relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
         <div className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] h-1.5 w-full relative z-10" />
         <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
           <div className="flex items-center gap-4">
             <div className="bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] p-3 rounded-2xl text-slate-900 dark:text-white shadow-lg">
               <Sparkles className="h-6 w-6 animate-pulse" />
             </div>
             <div>
               <CardTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">AI Intelligent Import</CardTitle>
               <p className="text-xs font-black text-[#8B5CF6] uppercase tracking-[0.2em]">Local AI Optimized (Ollama)</p>
             </div>
           </div>
           
           {/* Account switcher */}
           <div className="z-20">
             <Select
               value={selectedAccountId}
               onValueChange={setSelectedAccountId}
             >
               <SelectTrigger className="w-48 bg-[#111827] border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200">
                 <SelectValue placeholder="Select Account" />
               </SelectTrigger>
               <SelectContent className="bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                 {accounts.map((account) => (
                   <SelectItem key={account.id} value={account.id} className="focus:bg-white dark:bg-[#1E293B] focus:text-slate-900 dark:text-white">
                     {account.name} (₹{parseFloat(account.balance).toLocaleString("en-IN")})
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </CardHeader>
         <CardContent className="relative z-10 pt-4 pb-8">
            <StatementUpload 
              accountId={selectedAccountId} 
              onComplete={() => router.refresh()} 
            />
         </CardContent>
      </Card>

      {/* Analytics Charts Panel */}
      <Card className="border-none shadow-xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-0 px-8 pt-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl text-[#3B82F6]">
              <TrendingUp size={20} />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Financial Analytics</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Interactive intelligence reports</p>
            </div>
          </div>
          
          {/* Chart Selection Tabs */}
          <div className="flex items-center bg-[#111827] p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveChartTab("area")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                activeChartTab === "area" ? "bg-[#3B82F6] text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
              )}
            >
              Spending Analytics
            </button>
            <button
              onClick={() => setActiveChartTab("bar")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                activeChartTab === "bar" ? "bg-[#3B82F6] text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
              )}
            >
              Income vs Expense
            </button>
            <button
              onClick={() => setActiveChartTab("pie")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                activeChartTab === "pie" ? "bg-[#3B82F6] text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
              )}
            >
              Category Split
            </button>
            <button
              onClick={() => setActiveChartTab("line")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                activeChartTab === "line" ? "bg-[#3B82F6] text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
              )}
            >
              Savings Trend
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="h-[350px] w-full pt-8">
            {!isMounted ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-900/40 rounded-3xl animate-pulse">
                <TrendingUp className="text-slate-700 h-10 w-10" />
              </div>
            ) : barChartData.every(d => d.income === 0 && d.expense === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                  <TrendingUp className="text-slate-600 h-8 w-8" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold">No activity in the last 7 days</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Try importing a statement</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" key={`rc-chart-${activeChartTab}-${chartId}`}>
                {activeChartTab === "area" ? (
                  <AreaChart 
                    id={`area-chart-${chartId}`}
                    data={barChartData} 
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id={`expenseGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                      <filter id={`glow-${chartId}`}>
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl min-w-[160px]">
                              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Daily Expenses</span>
                                </div>
                                <span className="text-xs font-black text-[#EF4444]">
                                  ₹{payload[0].value.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone"
                      name="Daily Expenses"
                      dataKey="expense" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      fillOpacity={1}
                      fill={`url(#expenseGradient-${chartId})`} 
                      filter={`url(#glow-${chartId})`}
                      animationDuration={1500}
                    />
                  </AreaChart>
                ) : activeChartTab === "bar" ? (
                  <BarChart
                    data={barChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl min-w-[160px]">
                              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
                              {payload.map((entry) => (
                                <div key={entry.name} className="flex items-center justify-between gap-4 mb-1.5 last:mb-0">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{entry.name}</span>
                                  </div>
                                  <span className={cn("text-xs font-black", entry.name === 'Income' ? 'text-[#22C55E]' : 'text-[#EF4444]')}>
                                    ₹{entry.value.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                    />
                    <Bar name="Income" dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar name="Expense" dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                ) : activeChartTab === "pie" ? (
                  pieChartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                        <PieChartIcon className="text-slate-600 h-8 w-8" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-bold">No expenses categorized this month</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 h-full items-center">
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              <filter id="pieGlow">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" floodColor="#000" />
                              </filter>
                            </defs>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              dataKey="value"
                              labelLine={false}
                              paddingAngle={6}
                              animationDuration={1000}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell 
                                  key={`pie-cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]} 
                                  stroke="none"
                                  filter="url(#pieGlow)"
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-2xl shadow-2xl">
                                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{payload[0].name}</p>
                                      <p className="text-sm font-black">₹{payload[0].value.toLocaleString("en-IN")}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-2">
                        {pieChartData.sort((a, b) => b.value - a.value).map((category, index) => (
                          <div key={category.name} className="flex items-center justify-between p-3 rounded-2xl bg-[#111827]/40 hover:bg-[#111827] transition-all border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">{category.name.replace(/-/g, ' ')}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">₹{category.value.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <LineChart
                    data={barChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl min-w-[160px]">
                              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Daily Savings</span>
                                </div>
                                <span className={cn(
                                  "text-xs font-black",
                                  payload[0].value >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                                )}>
                                  ₹{payload[0].value.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      name="Daily Savings"
                      dataKey="savings" 
                      stroke="#8B5CF6" 
                      strokeWidth={3} 
                      dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgraded Recent Transactions Table */}
      <Card className="border-none shadow-2xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden" id="alerts">
        {/* Table Filters Header */}
        <CardHeader className="px-8 py-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="w-2.5 h-6 bg-[#8B5CF6] rounded-full" />
              Recent Transactions
            </CardTitle>
            
            {/* Search and Filters bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex items-center gap-2 bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 w-60">
                <Search size={14} className="text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search merchant, category..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 placeholder-slate-500 w-full"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Filter size={12} className="text-slate-500" />
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-[#111827]">All Types</option>
                  <option value="INCOME" className="bg-[#111827]">Income</option>
                  <option value="EXPENSE" className="bg-[#111827]">Expense</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Filter size={12} className="text-slate-500" />
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer text-xs capitalize"
                >
                  <option value="all" className="bg-[#111827]">All Categories</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat} className="bg-[#111827] capitalize">{cat.replace(/-/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Table Body */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#111827]/30">
                  <th className="p-4 pl-8 text-xs font-black uppercase tracking-wider text-slate-500">Date</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-500">Merchant</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-500">Category</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-500">Payment Method</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-500 text-right">Amount</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                  <th className="p-4 pr-8 text-xs font-black uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-xs font-semibold">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => {
                    const statusInfo = getStatusDetails(transaction.status || "COMPLETED");
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr
                        key={transaction.id}
                        className="hover:bg-white/5 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        {/* Date */}
                        <td className="p-4 pl-8 text-slate-500 dark:text-slate-400">
                          {format(new Date(transaction.date), "dd MMM yyyy")}
                        </td>

                        {/* Merchant */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shadow-inner",
                              transaction.type === "EXPENSE" 
                                ? "bg-rose-500/10 text-[#EF4444]" 
                                : "bg-green-500/10 text-[#22C55E]"
                            )}>
                              {transaction.type === "EXPENSE" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                            </div>
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                              {transaction.description || "Transaction"}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 capitalize">
                            {transaction.category.replace(/-/g, ' ')}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="p-4 text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={12} className="text-slate-500" />
                            <span>{getPaymentMethod(transaction)}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="p-4 text-right">
                          <span className={cn(
                            "text-sm font-black tracking-tight",
                            transaction.type === "EXPENSE" ? "text-[#EF4444]" : "text-[#22C55E]"
                          )}>
                            {transaction.type === "EXPENSE" ? "-" : "+"}₹{Number(transaction.amount).toLocaleString("en-IN")}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-black uppercase tracking-wider", statusInfo.className)}>
                            <StatusIcon size={10} />
                            {transaction.status || "COMPLETED"}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 pr-8 text-right">
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            disabled={deleteLoading}
                            className="text-slate-500 hover:text-[#EF4444] transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800/80"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-4 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                Showing Page {currentPage} of {totalPages} ({processedTransactionsList.length} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#111827] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#111827] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
