"use client";

import { ArrowUpRight, ArrowDownRight, CreditCard, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault();
    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return;
    }
    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  // Determine card gradient based on account type
  const gradientMap = {
    CURRENT: "from-indigo-500 to-violet-600",
    SAVINGS: "from-emerald-500 to-teal-600",
    CREDIT: "from-rose-500 to-pink-600",
    INVESTMENT: "from-amber-500 to-orange-500",
  };
  const gradient = gradientMap[type] || "from-indigo-500 to-violet-600";

  return (
    <Link href={`/account/${id}`}>
      <div className="group relative cursor-pointer transition-all duration-500 hover:-translate-y-2">
        {/* Main Card Container */}
        <div className={cn(
          "relative h-56 w-full rounded-[2rem] overflow-hidden shadow-2xl p-8 flex flex-col justify-between transition-all duration-500",
          "bg-gradient-to-br",
          gradient,
          "group-hover:shadow-indigo-500/20 group-hover:scale-[1.02]"
        )}>
          {/* Glass Overlay for texture */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-50" />
          
          {/* Animated Background Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors duration-700" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl group-hover:bg-black/20 transition-colors duration-700" />

          {/* Card Content Layer */}
          <div className="relative z-10">
            {/* Header: Type and Default Toggle */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white/70">
                    {type} ACCOUNT
                  </p>
                  {isDefault && (
                    <div className="bg-white/20 backdrop-blur-md p-1 rounded-md">
                      <Star size={10} className="fill-white text-slate-900 dark:text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {name}
                </h3>
              </div>
              <div onClick={(e) => e.stopPropagation()} className="bg-white/10 backdrop-blur-md p-1 rounded-xl">
                <Switch
                  checked={isDefault}
                  onClick={handleDefaultChange}
                  disabled={updateDefaultLoading}
                  className="data-[state=checked]:bg-white data-[state=checked]:text-indigo-600 scale-90"
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            {/* Balance Section */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-900 dark:text-white/60 uppercase tracking-[0.2em] mb-1">Current Balance</p>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white/50">₹</span>
                {parseFloat(balance).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* Footer with Card Symbol and Type Icon */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    {type === "EXPENSE" ? <ArrowDownRight className="h-4 w-4 text-slate-900 dark:text-white" /> : <ArrowUpRight className="h-4 w-4 text-slate-900 dark:text-white" />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-900 dark:text-white/50 uppercase tracking-widest leading-none">Growth</p>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white leading-none mt-1">Active</p>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-slate-900 dark:text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
