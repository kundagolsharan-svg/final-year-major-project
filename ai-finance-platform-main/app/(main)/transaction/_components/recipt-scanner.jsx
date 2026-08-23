"use client";

import { useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";

export function ReceiptScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);

  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedData,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    await scanReceiptFn(file);
  };

  useEffect(() => {
    if (scannedData && !scanReceiptLoading) {
      onScanComplete(scannedData);
      toast.success("Receipt scanned successfully");
    }
  }, [scanReceiptLoading, scannedData]);

  return (
    <div className="flex items-center gap-4 relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
        }}
      />
      <div className="relative w-full rounded-md overflow-hidden">
        {/* Laser Scanning Animation */}
        <AnimatePresence>
          {scanReceiptLoading && (
            <motion.div
              initial={{ left: "-10%" }}
              animate={{ left: "110%" }}
              transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
              className="absolute top-0 bottom-0 w-8 bg-emerald-400/50 blur-[8px] z-10 pointer-events-none skew-x-[-20deg]"
            />
          )}
        </AnimatePresence>

        <Button
          type="button"
          variant="outline"
          className="relative w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 hover:opacity-90 transition-opacity text-slate-900 dark:text-white hover:text-slate-900 dark:text-white overflow-hidden border-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanReceiptLoading}
        >
          <div className="relative z-20 flex items-center justify-center w-full">
            {scanReceiptLoading ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                <span>Scanning Receipt...</span>
              </>
            ) : (
              <>
                <Camera className="mr-2" />
                <span>Scan Receipt with AI</span>
              </>
            )}
          </div>
        </Button>
      </div>
    </div>
  );
}
