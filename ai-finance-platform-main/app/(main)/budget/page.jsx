import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { getBudgetData } from "@/actions/budget";
import { BudgetView } from "./_components/budget-view";

export const metadata = {
  title: "Monthly Budget Planner | SAMPAT AI Finance",
  description: "Set spending limits, track expenses, and optimize your monthly budget with AI insights.",
};

async function BudgetData() {
  const data = await getBudgetData();
  return <BudgetView initialData={data} />;
}

export default function BudgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm font-semibold animate-pulse">
          Loading budget planner…
        </div>
      }
    >
      <BudgetData />
    </Suspense>
  );
}
