"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Utensils, ArrowUpRight, ArrowDownRight, AlertCircle, Lightbulb, Sparkles, Home, Car, ShoppingBag, HeartPulse, GraduationCap, Plane, FileText, Smartphone, CreditCard, MoreHorizontal, RefreshCw } from "lucide-react";
import { getDynamicForecasts } from "@/actions/forecast";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

// Map categories to icons
const getCategoryIcon = (category) => {
  const cat = category.toLowerCase();
  if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant") || cat.includes("groceries")) return <Utensils size={18} />;
  if (cat.includes("house") || cat.includes("rent") || cat.includes("mortgage")) return <Home size={18} />;
  if (cat.includes("transport") || cat.includes("car") || cat.includes("gas") || cat.includes("fuel")) return <Car size={18} />;
  if (cat.includes("shop") || cat.includes("clothing") || cat.includes("electronics")) return <ShoppingBag size={18} />;
  if (cat.includes("health") || cat.includes("medical") || cat.includes("pharmacy")) return <HeartPulse size={18} />;
  if (cat.includes("education") || cat.includes("school") || cat.includes("college")) return <GraduationCap size={18} />;
  if (cat.includes("travel") || cat.includes("flight") || cat.includes("hotel")) return <Plane size={18} />;
  if (cat.includes("bill") || cat.includes("utility") || cat.includes("electricity") || cat.includes("water")) return <FileText size={18} />;
  if (cat.includes("phone") || cat.includes("internet") || cat.includes("subscription") || cat.includes("entertainment")) return <Smartphone size={18} />;
  if (cat.includes("insurance") || cat.includes("tax") || cat.includes("fee")) return <CreditCard size={18} />;
  return <MoreHorizontal size={18} />;
};

export default function ForecastPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async (force = false) => {
    setLoading(true);
    try {
      const res = await getDynamicForecasts(force);
      if (res.error) {
        toast.error(res.error);
      } else if (res.empty) {
        setData({ forecasts: [] });
      } else {
        setData(res);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <TrendingUp size={24} />
            </div>
            AI Spending Forecast
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Predictive analytics powered by your spending history to help you stay ahead of your budget.
          </p>
        </div>
        
        <button
          onClick={() => fetchForecast(true)}
          disabled={loading}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Recalculate
        </button>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <BarLoader color="#8B5CF6" width={150} />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Our AI is analyzing your spending trends...</p>
        </div>
      ) : data?.forecasts?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.forecasts.map((forecast, idx) => (
            <Card key={idx} className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10">
              {/* Decorative glow */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl transition-colors duration-500 ${forecast.isUp ? 'bg-rose-500/10 dark:bg-rose-500/20 group-hover:bg-rose-500/30' : 'bg-emerald-500/10 dark:bg-emerald-500/20 group-hover:bg-emerald-500/30'}`} />
              
              <CardHeader className="pb-4 relative z-10 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${forecast.isUp ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                      {getCategoryIcon(forecast.category)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">{forecast.category}</CardTitle>
                      <CardDescription className="text-xs font-semibold text-slate-500">{forecast.isUp ? "Predicted Increase" : "Predicted Decrease"}</CardDescription>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${forecast.isUp ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
                    {forecast.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {forecast.isUp ? '+' : ''}{forecast.variancePct}%
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 relative z-10 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Month</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">₹{forecast.currentMonthAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="space-y-1 pl-4 border-l border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      Predicted <Sparkles size={12} className="text-indigo-500" />
                    </p>
                    <p className={`text-2xl font-black ${forecast.isUp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>₹{forecast.predictedNextMonthAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Reason */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Reason</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          {forecast.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                    <div className="flex items-start gap-3">
                      <Lightbulb size={18} className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Recommendation</h4>
                        <p className="text-sm text-indigo-900/80 dark:text-indigo-200 leading-relaxed font-medium">
                          {forecast.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
            <Sparkles size={32} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Not enough data yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            We need at least a few transactions across multiple months to generate accurate AI predictions.
          </p>
        </div>
      )}
    </div>
  );
}
