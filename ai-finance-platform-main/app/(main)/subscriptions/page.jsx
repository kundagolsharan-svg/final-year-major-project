import { Suspense } from "react";
import { getUserTransactions } from "@/actions/transaction";
import { PageSkeleton } from "@/components/page-skeleton";
import { SubscriptionHub } from "./_components/subscription-hub";

export const metadata = {
  title: "Subscriptions & Recurring | SAMPAT AI Finance",
  description: "Manage your recurring bills and subscriptions effortlessly.",
};

async function SubscriptionData() {
  const result = await getUserTransactions();
  const transactions = result.success ? result.data : [];
  
  const subscriptions = transactions.filter((t) => t.isRecurring);

  return <SubscriptionHub subscriptions={subscriptions} />;
}

export default function SubscriptionsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Subscriptions</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
          Track and manage your recurring payments and bills.
        </p>
      </div>
      <Suspense fallback={<PageSkeleton title="Subscriptions" cards={3} />}>
        <SubscriptionData />
      </Suspense>
    </div>
  );
}


