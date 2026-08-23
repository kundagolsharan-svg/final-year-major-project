import { Suspense } from "react";
export const dynamic = "force-dynamic";
import {
  getUserAccounts,
  getDashboardData,
  getSpendingInsights,
} from "@/actions/dashboard";
import { DashboardMain } from "./_components/dashboard-main";
import { PageSkeleton } from "@/components/page-skeleton";

export const metadata = {
  title: "Financial Dashboard | SAMPAT AI Finance",
  description: "Monitor your accounts, real-time balances, recent transactions, and spending insights.",
};

async function DashboardData() {
  const [accounts, transactions, spendingInsights] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
    getSpendingInsights(),
  ]);

  return (
    <DashboardMain
      accounts={accounts || []}
      transactions={transactions || []}
      spendingInsights={spendingInsights || []}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton title="Dashboard" cards={4} />}>
      <DashboardData />
    </Suspense>
  );
}


