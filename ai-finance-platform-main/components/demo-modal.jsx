"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

export function DemoModal() {
  return (
    <a 
      href="https://notebook.google.com/notebook/118ace67-8ea1-451c-9c33-52dd166b15ee/artifact/fc09d435-b751-4019-8ffb-45431f8abd35?utm_source=nlm_web_share&utm_medium=google_oo&utm_campaign=art_share_1&utm_content=&utm_smc=nlm_web_share_google_oo_art_share_1_"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button
        size="lg"
        variant="outline"
        className="px-8 h-14 text-base font-semibold border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 dark:hover:text-white rounded-2xl transition-all duration-200 bg-transparent flex items-center gap-2 group"
      >
        <PlayCircle size={20} className="group-hover:text-indigo-500 transition-colors" />
        See how it works
      </Button>
    </a>
  );
}
