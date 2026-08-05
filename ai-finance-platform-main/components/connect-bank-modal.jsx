"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Landmark,
  Loader2,
  ShieldCheck,
  Smartphone,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Building2,
  ArrowRight,
  RefreshCw,
  Lock,
} from "lucide-react";
import {
  sendAAOtp,
  discoverBankAccountsByMobile,
  approveConsentAndSyncAccounts,
} from "@/actions/account-aggregator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ConnectBankModal({ children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: Account Selection & Consent, 4: Success
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("123456");
  const [discoveredAccounts, setDiscoveredAccounts] = useState([]);
  const [selectedBankIds, setSelectedBankIds] = useState([]);
  const [syncMetrics, setSyncMetrics] = useState(null);

  const resetFlow = () => {
    setStep(1);
    setLoading(false);
    setPhone("");
    setOtp("123456");
    setDiscoveredAccounts([]);
    setSelectedBankIds([]);
    setSyncMetrics(null);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid 10-digit bank-registered mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendAAOtp(phone);
      if (res.success) {
        toast.success(res.message);
        setStep(2);
      } else {
        toast.error(res.error || "Failed to send OTP");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Discover Accounts
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP (123456).");
      return;
    }

    setLoading(true);
    try {
      const res = await discoverBankAccountsByMobile(phone, otp);
      if (res.success) {
        setDiscoveredAccounts(res.discoveredAccounts);
        // Select all by default
        setSelectedBankIds(res.discoveredAccounts.map((a) => a.bankId));
        toast.success(`Discovered ${res.discoveredAccounts.length} bank account(s) linked to +91 ${phone}!`);
        setStep(3);
      } else {
        toast.error(res.error || "OTP Verification failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Approve Consent & Fetch Transactions Automatically
  const handleApproveConsent = async () => {
    if (selectedBankIds.length === 0) {
      toast.error("Please select at least one bank account to link.");
      return;
    }

    setLoading(true);
    try {
      const res = await approveConsentAndSyncAccounts(selectedBankIds, phone);
      if (res.success) {
        setSyncMetrics(res);
        toast.success(`Successfully connected ${res.linkedAccountsCount} bank account(s)!`);
        setStep(4);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to sync accounts via Account Aggregator");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBankSelection = (bankId) => {
    if (selectedBankIds.includes(bankId)) {
      setSelectedBankIds(selectedBankIds.filter((id) => id !== bankId));
    } else {
      setSelectedBankIds([...selectedBankIds, bankId]);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetFlow();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 rounded-3xl overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D]">
        {/* Modal Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-sm text-white">
                <Landmark size={22} />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  Account Aggregator (AA) Sync
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-bold uppercase">
                    RBI Approved
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-indigo-100 mt-0.5">
                  Link bank accounts by registered mobile number & auto-fetch transactions.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
            {[
              { label: "Mobile", stepNum: 1 },
              { label: "Verify OTP", stepNum: 2 },
              { label: "Discovered Banks", stepNum: 3 },
              { label: "Connected", stepNum: 4 },
            ].map((st, i) => (
              <div key={st.stepNum} className="flex-1 flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center transition-all",
                    step >= st.stepNum
                      ? "bg-white text-indigo-700 font-extrabold"
                      : "bg-white/20 text-white/70"
                  )}
                >
                  {step > st.stepNum ? "✓" : st.stepNum}
                </div>
                <span className="text-[10px] font-bold text-white/90 truncate hidden sm:inline">
                  {st.label}
                </span>
                {i < 3 && <div className="flex-1 h-0.5 bg-white/20 rounded-full" />}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-4">
          {/* STEP 1: MOBILE NUMBER ENTRY */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                  Enter the 10-digit mobile number linked to your Indian bank accounts (HDFC, SBI, ICICI, Axis, Kotak, etc.). No passwords or netbanking credentials required.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Smartphone size={14} className="text-indigo-600" /> Bank Registered Mobile Number
                </label>
                <div className="flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden focus-within:border-indigo-500">
                  <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm border-r border-slate-200 dark:border-slate-800 flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="98765 43210"
                    className="w-full px-3.5 py-2.5 bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Send AA Verification OTP <ArrowRight size={14} className="ml-1" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    OTP sent to +91 {phone}
                  </p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                    Use test OTP: <strong className="font-mono text-xs">123456</strong>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="text-xs text-indigo-600 font-semibold"
                >
                  Change Number
                </Button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <KeyRound size={14} className="text-indigo-600" /> Enter 6-Digit Verification OTP
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="123456"
                  className="rounded-2xl text-center text-lg tracking-widest font-black h-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Verify & Discover Bank Accounts <Sparkles size={14} className="ml-1" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* STEP 3: DISCOVERED ACCOUNTS SELECTION & CONSENT APPROVAL */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Discovered Bank Accounts
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Accounts found registered under +91 {phone}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {discoveredAccounts.length} Accounts Found
                </span>
              </div>

              {/* Account Checklist */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {discoveredAccounts.map((acc) => {
                  const isChecked = selectedBankIds.includes(acc.bankId);
                  return (
                    <div
                      key={acc.bankId}
                      onClick={() => toggleBankSelection(acc.bankId)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                        isChecked
                          ? "bg-indigo-500/10 border-indigo-500/50 text-slate-900 dark:text-white"
                          : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs text-indigo-600 shrink-0">
                          {acc.bankId}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {acc.bankName}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500">
                            {acc.accountType} Acc ({acc.accountNumber})
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            ₹{Number(acc.balance).toLocaleString("en-IN")}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold">
                            {acc.txnPreviewCount} Recent Txns
                          </p>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-black border transition-colors",
                            isChecked
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-slate-300 dark:border-slate-700"
                          )}
                        >
                          {isChecked && "✓"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RBI Consent Detail Strip */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock size={12} className="text-indigo-600" /> Consent Scope & Validity:
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Scope: Read-Only Bank Statements & Balances • Frequency: Daily Automated Fetch • Duration: 1 Year (Revocable anytime)
                </p>
              </div>

              <Button
                onClick={handleApproveConsent}
                disabled={loading || selectedBankIds.length === 0}
                className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Approve Consent & Sync Transactions ({selectedBankIds.length} Banks){" "}
                    <CheckCircle2 size={14} className="ml-1" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* STEP 4: SUCCESS COMPLETION SCREEN */}
          {step === 4 && syncMetrics && (
            <div className="p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Bank Accounts Connected Successfully!
                </h3>
                <p className="text-xs text-slate-500">
                  {syncMetrics.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Accounts Linked</p>
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {syncMetrics.linkedAccountsCount} Banks
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Transactions Synced</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {syncMetrics.syncedTransactionsCount} Items
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setOpen(false);
                  resetFlow();
                  router.refresh();
                }}
                className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
