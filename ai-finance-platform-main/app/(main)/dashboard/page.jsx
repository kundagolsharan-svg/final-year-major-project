import { Suspense } from "react";
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

export default async function DashboardPage() {
  const [accounts, transactions, spendingInsights] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
    getSpendingInsights(),
  ]);

  return (
    <Suspense fallback={<PageSkeleton title="Dashboard" cards={4} />}>
      <DashboardMain
        accounts={accounts || []}
        transactions={transactions || []}
        spendingInsights={spendingInsights || []}
      />
    </Suspense>
  );
}
