"use client";

import { useEffect, useState, useCallback } from "react";
import { getBehaviorAnalysis } from "@/actions/behavior-analyzer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarLoader } from "react-spinners";
import { BrainCircuit, PieChart, Info, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await getBehaviorAnalysis(forceRefresh);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BarLoader width={200} color="#6366f1" />
        <p className="text-slate-500 font-medium animate-pulse">SAMPAT AI is analyzing your spending patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Card className="border-rose-100 bg-rose-50 text-rose-900 shadow-2xl rounded-[2.5rem] overflow-hidden max-w-2xl w-full">
           <div className="bg-rose-500 h-2 w-full" />
           <CardHeader className="p-8 pb-4">
             <CardTitle className="text-2xl font-black flex items-center gap-3">
               <AlertTriangle className="h-8 w-8" />
               AI Insight Error
             </CardTitle>
           </CardHeader>
           <CardContent className="p-8 pt-0 space-y-4">
             <div className="bg-white/50 p-4 rounded-2xl border border-rose-100 font-bold text-rose-800">
                {error}
             </div>
             <p className="text-sm font-medium leading-relaxed opacity-80">
               <span className="font-black underline uppercase">Troubleshooting Your Local AI</span><br/>
               Ensure that **Ollama** is running on your computer and you have downloaded the model:
               <code className="block mt-2 bg-black/20 p-2 rounded text-xs font-mono">ollama run llama3.2</code>
             </p>
             <div className="pt-2">
               <Button onClick={() => fetchData(true)} className="rounded-xl">
                 Try Again
               </Button>
             </div>
           </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <BrainCircuit className="h-9 w-9 text-indigo-600 dark:text-indigo-400" />
            Financial Behavior Analyzer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            AI-driven insights into your spending habits and financial health.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto rounded-xl border-slate-200 dark:border-slate-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Analyzing..." : "Re-Analyze"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize">
              {Object.keys(data?.categoryTotals || {}).sort((a,b) => data.categoryTotals[b] - data.categoryTotals[a])[0] || "None"}
            </div>
          </CardContent>
        </Card>
        
        {/* Total Evaluated - Dark Orange Theme */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#9a3412] text-white rounded-2xl shadow-orange-600/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-orange-100 uppercase tracking-wider">Total Evaluated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-white">
               ₹{Object.values(data?.categoryTotals || {}).reduce((a, b) => a + b, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800/80 shadow-xl bg-white dark:bg-[#141B2D] rounded-2xl">
          <CardHeader className="pb-2 text-slate-800 dark:text-slate-200">
            <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-60">AI Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">High</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed AI Analysis */}
        <Card className="lg:col-span-2 shadow-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#141B2D] rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
              <div>
                <CardTitle className="text-xl">AI Insights & Suggestions</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">Deep dive into your financial psychology</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none prose-headings:text-indigo-600 dark:prose-headings:text-indigo-400 prose-strong:text-indigo-700 dark:prose-strong:text-indigo-300">
            <ReactMarkdown>{data?.analysis}</ReactMarkdown>
          </CardContent>
        </Card>

        {/* Breakdown & Tips */}
        <div className="space-y-6">
          <Card className="shadow-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#141B2D] rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(data?.categoryTotals || {}).map(([cat, total]) => {
                const totalSpend = Object.values(data?.categoryTotals || {}).reduce((a, b) => a + b, 0);
                const pct = totalSpend > 0 ? ((total / totalSpend) * 100).toFixed(0) : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">
                      <span>{cat}</span>
                      <span>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(data?.categoryTotals || {}).length === 0 && (
                <p className="text-slate-400 text-sm">No expenses recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl border border-indigo-100 dark:border-indigo-950/50 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <Lightbulb className="h-6 w-6" />
              <h3 className="font-bold">Next Best Action</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Based on your top categories, setting a targeted budget limit could save you up to 15% more each month.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
