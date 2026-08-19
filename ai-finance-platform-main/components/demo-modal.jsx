"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

export function DemoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="px-8 h-14 text-base font-semibold border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 dark:hover:text-white rounded-2xl transition-all duration-200 bg-transparent flex items-center gap-2 group"
        >
          <PlayCircle size={20} className="group-hover:text-indigo-500 transition-colors" />
          Watch Demo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl p-1 bg-black/90 border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <DialogTitle className="sr-only">SAMPAT Demo Video</DialogTitle>
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900">
          {/* Replace this iframe src with your actual Loom, YouTube, or Vimeo link once recorded */}
          {isOpen && (
            <iframe
              className="absolute inset-0 w-full h-full border-0"
              src="https://www.youtube.com/embed/vwSlbG0cv5I?autoplay=1&rel=0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="SAMPAT Demo Video"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
