"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUpcomingBills } from "@/actions/dashboard";
import { format } from "date-fns";
import { Bell, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function BillReminders() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBills() {
      try {
        const data = await getUpcomingBills();
        setBills(data);
      } catch (error) {
        console.error("Failed to fetch bills:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBills();
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse bg-white dark:bg-[#1E293B]/60 border border-white/10 rounded-[2.5rem] p-6">
        <CardHeader>
          <CardTitle className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (bills.length === 0) return null;

  return (
    <Card className="border-none shadow-2xl bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden group">
      <CardHeader className="pb-4 pt-8 px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
              <Bell className="h-5 w-5 animate-bounce" />
            </div>
            Critical Reminders
          </CardTitle>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-slate-900 shadow-sm px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
            {bills.length} UPCOMING
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="space-y-4">
          {bills.map((bill) => {
            const dueDate = new Date(bill.nextRecurringDate);
            const diffTime = dueDate.getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isOverdue = diffDays < 0;

            return (
              <div
                key={bill.id}
                className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:bg-[#111827] transition-colors shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    isOverdue ? "bg-rose-500/10 text-[#EF4444]" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {isOverdue ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Calendar className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                      {bill.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {bill.account.name}
                      </p>
                      <span className="w-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
                      <p className="text-[10px] text-[#8B5CF6] font-black uppercase tracking-widest">
                        {bill.category}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-slate-900 dark:text-white tracking-tighter">₹{parseFloat(bill.amount).toLocaleString('en-IN')}</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-1",
                    isOverdue ? "text-rose-400 animate-pulse" : "text-amber-400"
                  )}>
                    {isOverdue ? "Overdue" : `Due in ${diffDays} days`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
