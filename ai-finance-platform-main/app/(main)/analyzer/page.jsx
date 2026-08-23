import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { getDashboardData } from "@/actions/dashboard";
import { AnalyticsView } from "./_components/analytics-view";
import { PageSkeleton } from "@/components/page-skeleton";

export const metadata = {
  title: "Financial Analytics & Trends | SAMPAT AI Finance",
  description: "Detailed cash flow trends, category distributions, and income vs expense metrics.",
};

async function AnalyticsData() {
  const transactions = await getDashboardData();
  return <AnalyticsView initialTransactions={transactions || []} />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton title="Financial Analytics" cards={4} />}>
      <AnalyticsData />
    </Suspense>
  );
}
