"use client";

import { UserProfile } from "@clerk/nextjs";
import { ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

export default function SecurityPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
          <div className="bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck size={24} />
          </div>
          Security & Access Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Manage your Two-Factor Authentication, active devices, and account security.
        </p>
      </div>

      <div className="flex justify-center mt-6 w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#0a0a0f]">
        <UserProfile 
          routing="hash"
          appearance={{
            baseTheme: currentTheme === "dark" ? dark : undefined,
            elements: {
              rootBox: "w-full max-w-full",
              card: "w-full max-w-full shadow-none",
              navbar: "hidden md:block", 
            }
          }}
        />
      </div>
    </div>
  );
}
