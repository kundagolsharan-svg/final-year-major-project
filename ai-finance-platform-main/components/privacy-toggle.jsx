"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrivacy } from "@/components/providers/privacy-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PrivacyToggle() {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePrivacyMode}
            className={`rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              isPrivacyMode ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" : "text-slate-500"
            }`}
          >
            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isPrivacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
