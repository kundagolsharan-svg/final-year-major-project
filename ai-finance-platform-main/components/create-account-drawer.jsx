"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Landmark, Sparkles, ArrowRight } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createAccount } from "@/actions/dashboard";
import { accountSchema } from "@/app/lib/schema";
import { ConnectBankModal } from "@/components/connect-bank-modal";

export function CreateAccountDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const {
    loading: createAccountLoading,
    fn: createAccountFn,
    error,
    data: newAccount,
  } = useFetch(createAccount);

  const onSubmit = async (data) => {
    await createAccountFn(data);
  };

  useEffect(() => {
    if (newAccount) {
      toast.success("Account created successfully");
      reset();
      setOpen(false);
    }
  }, [newAccount, reset]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to create account");
    }
  }, [error]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-w-xl mx-auto rounded-t-3xl">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-black flex items-center gap-2">
            Create or Link Account
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-5 pb-6 space-y-5">
          {/* Account Aggregator Quick Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white space-y-2 shadow-lg shadow-indigo-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark size={18} />
                <span className="text-xs font-black uppercase tracking-wider">
                  RBI Account Aggregator (AA) Sync
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-black">
                AUTO-SYNC
              </span>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Link your HDFC, SBI, ICICI, Axis or Kotak accounts by mobile number to automatically fetch accounts & transactions.
            </p>
            <div className="pt-1">
              <ConnectBankModal>
                <Button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full h-9 rounded-xl bg-white text-indigo-700 hover:bg-slate-100 font-extrabold text-xs shadow-sm cursor-pointer"
                >
                  Link via Mobile Number (AA Gateway) <ArrowRight size={14} className="ml-1" />
                </Button>
              </ConnectBankModal>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-[#0F172A] px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
              or create manual account
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Account Name
              </label>
              <Input
                id="name"
                placeholder="e.g. HDFC Salary Account"
                className="rounded-xl border-slate-200 dark:border-slate-800"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-rose-500 font-semibold">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="type"
                className="text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Account Type
              </label>
              <Select
                onValueChange={(value) => setValue("type", value)}
                defaultValue={watch("type")}
              >
                <SelectTrigger id="type" className="rounded-xl border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-rose-500 font-semibold">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="balance"
                className="text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Initial Balance (₹)
              </label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="rounded-xl border-slate-200 dark:border-slate-800"
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-xs text-rose-500 font-semibold">{errors.balance.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/50">
              <div className="space-y-0.5">
                <label
                  htmlFor="isDefault"
                  className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  Set as Default Account
                </label>
                <p className="text-[11px] text-slate-500">
                  This account will be selected by default for new transactions
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={watch("isDefault")}
                onCheckedChange={(checked) => setValue("isDefault", checked)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1 rounded-xl">
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
                disabled={createAccountLoading}
              >
                {createAccountLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
