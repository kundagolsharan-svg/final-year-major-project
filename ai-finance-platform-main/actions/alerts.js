"use server";

import { db } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export async function getRealAlerts() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [budget, transactions, goals, accounts] = await Promise.all([
      db.budget.findFirst({
        where: { userId: user.id },
      }),
      db.transaction.findMany({
        where: {
          userId: user.id,
          date: { gte: subDays(now, 60) },
        },
        orderBy: { date: "desc" },
      }),
      db.financialGoal.findMany({
        where: { userId: user.id },
      }),
      db.account.findMany({
        where: { userId: user.id },
      }),
    ]);

    const generatedAlerts = [];

    // 1. Current Month Spending vs Budget Alert
    const currentMonthExpenses = transactions
      .filter(
        (t) =>
          t.type === "EXPENSE" &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentMonthIncome = transactions
      .filter(
        (t) =>
          t.type === "INCOME" &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    if (budget && Number(budget.amount) > 0) {
      const budgetAmount = Number(budget.amount);
      const percentSpent = Math.round((currentMonthExpenses / budgetAmount) * 100);
      const remaining = Math.max(0, budgetAmount - currentMonthExpenses);

      if (percentSpent >= 100) {
        generatedAlerts.push({
          id: "alert-budget-exceeded",
          type: "danger",
          severity: "danger",
          title: `Monthly Budget Exceeded (${percentSpent}%)`,
          message: `You have spent ₹${currentMonthExpenses.toLocaleString(
            "en-IN"
          )} exceeding your monthly budget limit of ₹${budgetAmount.toLocaleString(
            "en-IN"
          )} by ₹${(currentMonthExpenses - budgetAmount).toLocaleString("en-IN")}.`,
          time: "Live Trigger",
          read: false,
          actionUrl: "/budget",
          actionLabel: "Review Budget Planner",
        });
      } else if (percentSpent >= 75) {
        generatedAlerts.push({
          id: "alert-budget-warning",
          type: "warning",
          severity: "warning",
          title: `Monthly Budget Threshold Reached (${percentSpent}%)`,
          message: `You have utilized ${percentSpent}% of your ₹${budgetAmount.toLocaleString(
            "en-IN"
          )} monthly spending limit. ₹${remaining.toLocaleString(
            "en-IN"
          )} remaining for the rest of the month.`,
          time: "Live Trigger",
          read: false,
          actionUrl: "/budget",
          actionLabel: "View Budget Details",
        });
      } else {
        generatedAlerts.push({
          id: "alert-budget-good",
          type: "success",
          severity: "success",
          title: `Budget on Track (${percentSpent}% utilized)`,
          message: `Healthy spending! You have used ₹${currentMonthExpenses.toLocaleString(
            "en-IN"
          )} of your ₹${budgetAmount.toLocaleString(
            "en-IN"
          )} budget with ₹${remaining.toLocaleString("en-IN")} buffer remaining.`,
          time: "Today",
          read: true,
          actionUrl: "/budget",
          actionLabel: "Check Budget",
        });
      }
    }

    // 2. Cashflow & Burn Rate Alert
    if (currentMonthExpenses > currentMonthIncome && currentMonthIncome > 0) {
      generatedAlerts.push({
        id: "alert-cashflow-negative",
        type: "warning",
        severity: "warning",
        title: "Negative Monthly Cash Flow Detected",
        message: `This month's expenses (₹${currentMonthExpenses.toLocaleString(
          "en-IN"
        )}) exceed total income (₹${currentMonthIncome.toLocaleString(
          "en-IN"
        )}) by ₹${(currentMonthExpenses - currentMonthIncome).toLocaleString("en-IN")}.`,
        time: "1 day ago",
        read: false,
        actionUrl: "/analyzer",
        actionLabel: "Analyze Cash Flow",
      });
    }

    // 3. Large or High-Value Transaction Alert
    const highValTx = transactions.find(
      (t) => t.type === "EXPENSE" && Number(t.amount) >= 5000
    );
    if (highValTx) {
      generatedAlerts.push({
        id: `alert-high-${highValTx.id}`,
        type: "danger",
        severity: "danger",
        title: `High-Value Expense Flagged (₹${Number(
          highValTx.amount
        ).toLocaleString("en-IN")})`,
        message: `Large transaction of ₹${Number(
          highValTx.amount
        ).toLocaleString("en-IN")} recorded under "${highValTx.category}" for "${
          highValTx.description || "Expense"
        }" on ${format(new Date(highValTx.date), "dd MMM yyyy")}.`,
        time: format(new Date(highValTx.date), "dd MMM"),
        read: false,
        actionUrl: "/transaction/create",
        actionLabel: "View Transaction",
      });
    }

    // 4. Recurring Bills / Subscriptions Alert
    const recurringTxs = transactions.filter((t) => t.isRecurring);
    if (recurringTxs.length > 0) {
      const sample = recurringTxs[0];
      generatedAlerts.push({
        id: `alert-rec-${sample.id}`,
        type: "info",
        severity: "info",
        title: `Upcoming Recurring Subscription`,
        message: `Scheduled ${sample.recurringInterval?.toLowerCase() || "monthly"} bill for "${
          sample.description || sample.category
        }" (₹${Number(sample.amount).toLocaleString(
          "en-IN"
        )}) is active.`,
        time: "Upcoming",
        read: false,
        actionUrl: "/transaction/create",
        actionLabel: "Manage Subscriptions",
      });
    }

    // 5. Goals Milestones Alert
    if (goals.length > 0) {
      const topGoal = goals[0];
      const target = Number(topGoal.targetAmount) || 1;
      const current = Number(topGoal.currentAmount) || 0;
      const progress = Math.min(100, Math.round((current / target) * 100));

      if (progress >= 100) {
        generatedAlerts.push({
          id: `alert-goal-done-${topGoal.id}`,
          type: "success",
          severity: "success",
          title: `Goal Target Achieved: ${topGoal.name} 🎉`,
          message: `Congratulations! You reached 100% of your target for ${topGoal.name} (₹${target.toLocaleString(
            "en-IN"
          )}).`,
          time: "Recent",
          read: true,
          actionUrl: "/goals",
          actionLabel: "View Goals",
        });
      } else {
        generatedAlerts.push({
          id: `alert-goal-${topGoal.id}`,
          type: "info",
          severity: "info",
          title: `Goal Milestone: ${topGoal.name} (${progress}%)`,
          message: `You have saved ₹${current.toLocaleString(
            "en-IN"
          )} of ₹${target.toLocaleString(
            "en-IN"
          )} towards your "${topGoal.name}" goal.`,
          time: "Updated recently",
          read: true,
          actionUrl: "/goals",
          actionLabel: "Track Goals",
        });
      }
    }

    // Fallback baseline alert if no transactions exist yet
    if (generatedAlerts.length === 0) {
      generatedAlerts.push({
        id: "alert-welcome",
        type: "info",
        severity: "info",
        title: "SAMPAT Financial Monitor Active",
        message:
          "All monitoring guardrails are active. As you log transactions and set budgets, real-time alerts will automatically trigger here.",
        time: "Just now",
        read: false,
        actionUrl: "/transaction/create",
        actionLabel: "Add First Transaction",
      });
    }

    return {
      success: true,
      data: generatedAlerts,
    };
  } catch (error) {
    console.error("Get Alerts Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
