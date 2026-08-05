import { Suspense } from "react";
import { getDashboardData } from "@/actions/dashboard";
import { AnalyticsView } from "./_components/analytics-view";
import { PageSkeleton } from "@/components/page-skeleton";

export const metadata = {
  title: "Financial Analytics & Trends | SAMPAT AI Finance",
  description: "Detailed cash flow trends, category distributions, and income vs expense metrics.",
};

export default async function AnalyticsPage() {
  const transactions = await getDashboardData();

  return (
    <Suspense fallback={<PageSkeleton title="Financial Analytics" cards={4} />}>
      <AnalyticsView initialTransactions={transactions || []} />
    </Suspense>
  );
}
