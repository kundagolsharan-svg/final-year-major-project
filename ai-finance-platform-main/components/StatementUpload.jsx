"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { importTransactions } from "@/actions/import";

export default function StatementUpload({ accountId, onComplete }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split(".").pop().toLowerCase();
      if (fileType === "csv" || fileType === "pdf") {
        setFile(selectedFile);
      } else {
        toast.error("Please select a CSV or PDF file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!accountId) {
      toast.error("Please select an account first");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountId", accountId);

    try {
      const result = await importTransactions(formData);
      if (result.success) {
        toast.success(`Local AI successfully extracted ${result.count} transactions!`, {
          icon: <Sparkles className="h-4 w-4 text-amber-500" />,
        });
        setFile(null);
        if (onComplete) onComplete();
      } else {
        toast.error(result.message || "Failed to import transactions");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong during import");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-dashed border-2 bg-indigo-50/30 border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {!file ? (
            <label className="group flex flex-col items-center justify-center w-full h-40 cursor-pointer rounded-2xl border-2 border-transparent hover:border-indigo-300 transition-all">
              <div className="p-4 bg-indigo-100 rounded-full group-hover:scale-110 transition-transform text-indigo-600 mb-4 shadow-sm">
                <Upload className="h-10 w-10" />
              </div>
              <div>
                <span className="text-base font-semibold text-slate-700 block">Upload Bank Statement</span>
                <span className="text-xs text-slate-500 mt-1 block">Drag and drop CSV or PDF statements</span>
              </div>
              <div className="mt-4 px-3 py-1 bg-white rounded-full text-xs font-bold text-indigo-500 border border-indigo-100 shadow-sm uppercase tracking-wider">
                AI Processing Enabled
              </div>
              <input type="file" className="hidden" accept=".csv,.pdf" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="w-full flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{file.name}</p>
                  <p className="text-xs font-medium text-slate-400">{(file.size / 1024).toFixed(1)} KB • Ready for AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFile(null)} 
                  disabled={isUploading}
                  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                >
                  Remove
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-5 shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2 max-w-[300px] text-xs text-slate-400 font-medium bg-white/50 p-2 rounded-lg">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
            SAMPAT AI will automatically extract dates, amounts, and categorize your transactions from the statement text.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
