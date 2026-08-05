"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { importTransactions } from "@/actions/import";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileUp,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Building2,
  ArrowRight,
  X,
  UploadCloud,
  ShoppingBag,
  Coffee,
  ShoppingBasket,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PDFTransactionUploader({ accounts = [], onUploadSuccess, className }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts?.[0]?.id || ""
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (f) => {
    const ext = f.name.split(".").pop().toLowerCase();
    if (ext !== "pdf" && ext !== "csv") {
      toast.error("Please select a valid PDF or CSV file.");
      return;
    }
    setFile(f);
    setUploadResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a PDF transaction statement to upload.");
      return;
    }

    if (!selectedAccountId) {
      toast.error("Please select an account for the transactions.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Reading statement & extracting transaction records...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", selectedAccountId);

      // Status progression for user feedback
      const timer1 = setTimeout(() => {
        setUploadStatus("SAMPAT AI categorizing items (Shopping, Cold Drinks, Groceries, Bills)...");
      }, 2000);

      const timer2 = setTimeout(() => {
        setUploadStatus("Checking signatures & deduplicating against ledger...");
      }, 4500);

      const result = await importTransactions(formData);
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (result.success) {
        setUploadResult(result);
        router.refresh();
        if (result.count > 0) {
          toast.success(
            `Imported ${result.count} new transaction(s)!${
              result.duplicateCount > 0 ? ` (${result.duplicateCount} duplicates skipped)` : ""
            }`
          );
        } else {
          toast.info(result.message || "All transactions were already up to date.");
        }
        if (onUploadSuccess) onUploadSuccess();
      } else {
        toast.error(result.message || "Failed to parse transactions from statement.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "An error occurred while importing statement.");
    } finally {
      setIsUploading(false);
      setUploadStatus("");
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card
      className={cn(
        "rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-sm overflow-hidden transition-all duration-300",
        className
      )}
    >
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <FileUp size={20} />
            </div>
            <div>
              <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                PDF & CSV Statement Importer
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={11} /> Smart AI Categorization
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={11} /> Zero Duplication
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Drop your bank or card PDF statements. SAMPAT AI automatically parses, categorizes (Shopping, Cold Drinks, Dining, Groceries), and deduplicates entries.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {uploadResult ? (
          /* Success Screen */
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Statement Processed & Imported!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {uploadResult.message}
                </p>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500">New Imported</p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {uploadResult.count} Txns
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500">Duplicates Filtered</p>
                <p className="text-base font-black text-slate-700 dark:text-slate-300 mt-0.5">
                  {uploadResult.duplicateCount || 0} Skipped
                </p>
              </div>

              {uploadResult.totalInflow > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <TrendingUp size={10} className="text-emerald-500" /> Total Inflow
                  </p>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ₹{Number(uploadResult.totalInflow).toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              {uploadResult.totalOutflow > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <TrendingDown size={10} className="text-rose-500" /> Total Outflow
                  </p>
                  <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    ₹{Number(uploadResult.totalOutflow).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-2.5 justify-end">
              <Button
                onClick={() => {
                  handleReset();
                  router.refresh();
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
              >
                Upload Another Statement
              </Button>
            </div>
          </div>
        ) : (
          /* Upload Interface */
          <div className="space-y-4">
            {/* Account Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Ledger Account:
                </span>
              </div>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
                disabled={isUploading}
              >
                <SelectTrigger className="w-full sm:w-64 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141B2D]">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="text-xs font-semibold">
                      {acc.name} (₹{Number(acc.balance || 0).toLocaleString("en-IN")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group relative",
                isDragOver
                  ? "border-indigo-500 bg-indigo-500/5"
                  : file
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />

              {file ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[280px]">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {(file.size / 1024).toFixed(1)} KB • Click or drop another statement to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Drop your PDF transaction list or bank statement here, or{" "}
                      <span className="text-indigo-600 dark:text-indigo-400 underline font-black">
                        browse files
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      Supports HDFC, SBI, ICICI, Axis, Paytm, Cred, PhonePe & all standard bank statements (.pdf / .csv)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Category Preview Pill Strip */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mr-1">
                Auto-Categorized:
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1">
                <ShoppingBag size={11} /> Shopping
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1">
                <Coffee size={11} /> Cold Drinks & Cafe
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                <ShoppingBasket size={11} /> Groceries
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                <Zap size={11} /> Utilities & Bills
              </span>
            </div>

            {/* Uploading Status Indicator */}
            {isUploading && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 animate-in fade-in duration-200">
                <Loader2 size={18} className="animate-spin text-indigo-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    Processing Statement with SAMPAT AI
                  </p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                    {uploadStatus || "Extracting transaction records..."}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons & Badges */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                <ShieldCheck size={13} className="text-emerald-500" />
                Deduplication active: identical previous transactions will be preserved without duplicate records.
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {file && !isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="rounded-xl text-xs font-semibold text-slate-500"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading || !selectedAccountId}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-5 shadow-md shadow-indigo-500/20 w-full sm:w-auto cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-2" />
                      Parsing PDF Statement...
                    </>
                  ) : (
                    <>
                      <FileUp size={14} className="mr-2" />
                      Extract & Import Transactions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
