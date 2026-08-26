"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateWithFallback } from "@/lib/ollama";
import { sendEmail } from "./send-email";
import EmailTemplate from "@/emails/template";
import { getAuthUser } from "@/lib/auth-cache";

export async function getCurrentBudget(accountId) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new Error("User not found");
    }

    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // Get current month's expenses
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

export async function getBudgetData() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error("User not found");
    }

    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        accounts: true,
        budgets: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const startOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0,
      23,
      59,
      59
    );

    // Get all transactions for this month
    const thisMonthTransactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { date: "desc" },
    });

    // Get last month's expense sum
    const lastMonthExpenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const budget = user.budgets
      ? { ...user.budgets, amount: user.budgets.amount.toNumber() }
      : null;

    const serializedTransactions = thisMonthTransactions.map((t) => ({
      ...t,
      amount: t.amount ? t.amount.toNumber() : 0,
    }));

    const currentExpenses = serializedTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentIncome = serializedTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      budget,
      currentExpenses,
      currentIncome,
      transactions: serializedTransactions,
      accounts: (user.accounts || []).map((acc) => ({
        ...acc,
        balance: acc.balance ? acc.balance.toNumber() : 0,
      })),
      lastMonthExpenses: lastMonthExpenses._sum.amount
        ? lastMonthExpenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget data:", error);
    return {
      budget: null,
      currentExpenses: 0,
      currentIncome: 0,
      transactions: [],
      accounts: [],
      lastMonthExpenses: 0,
    };
  }
}

export async function updateBudget(amount) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("User not found");

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Please provide a valid budget amount");
    }

    // Update or create budget
    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount: numericAmount,
      },
      create: {
        userId: user.id,
        amount: numericAmount,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/budget");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}
export async function resetBudgetAlert() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("User not found");

    await db.budget.update({
      where: { userId: user.id },
      data: { lastAlertSent: null },
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting budget alert:", error);
    return { success: false, error: error.message };
  }
}

export async function checkBudgetAlert(userId) {
  try {
    const budget = await db.budget.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            accounts: true,
          },
        },
      },
    });

    if (!budget || budget.user.accounts.length === 0) return;

    const defaultAccount =
      budget.user.accounts.find((acc) => acc.isDefault) ||
      budget.user.accounts[0];

    const budgetAmount = budget.amount.toNumber();

    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const expenses = await db.transaction.aggregate({
      where: {
        userId,
        accountId: defaultAccount.id,
        type: "EXPENSE",
        date: { gte: startDate },
      },
      _sum: { amount: true },
    });

    const totalExpenses = expenses._sum.amount?.toNumber() || 0;
    const percentageUsed = (totalExpenses / budgetAmount) * 100;

    console.log(`Budget: ${budgetAmount}, Expenses: ${totalExpenses}, Percentage: ${percentageUsed.toFixed(1)}%`);

    if (percentageUsed >= 80) {
      // Check if alert was already sent this month
      if (budget.lastAlertSent) {
        const lastAlert = new Date(budget.lastAlertSent);
        const now = new Date();
        if (
          lastAlert.getMonth() === now.getMonth() &&
          lastAlert.getFullYear() === now.getFullYear()
        ) {
          return true; // Already sent this month, but still return true for UI
        }
      }

      if (budget.user.budgetAlerts !== false) {
        console.log("Threshold exceeded! Generating insights and sending email...");
        const monthName = new Date().toLocaleString("default", {
          month: "long",
        });

        // Generate AI insights for the budget alert
        const insights = await generateBudgetInsights(
          totalExpenses,
          budgetAmount,
          monthName
        );

        const emailResult = await sendEmail({
          to: budget.user.email,
          subject: `Budget Alert for ${defaultAccount.name}`,
          react: EmailTemplate({
            userName: budget.user.name,
            type: "budget-alert",
            data: {
              percentageUsed,
              budgetAmount: budgetAmount.toFixed(1),
              totalExpenses: totalExpenses.toFixed(1),
              accountName: defaultAccount.name,
              insights,
            },
          }),
        });

        console.log("Email send result:", emailResult);
      } else {
        console.log("Budget alerts are disabled by user, skipping email.");
      }

      // Update last alert sent
      await db.budget.update({
        where: { id: budget.id },
        data: { lastAlertSent: new Date() },
      });
      
      return true; // Budget exceeded
    }
    
    return false; // Budget not exceeded
  } catch (error) {
    console.error("Error in checkBudgetAlert server action:", error);
    return false;
  }
}

async function generateBudgetInsights(expenses, budgetAmount, month) {
  const percentageUsed = (expenses / budgetAmount) * 100;

  const prompt = `
    Analyze this budget situation and provide exactly 5 concise, actionable financial insights.
    The user has used ${percentageUsed.toFixed(1)}% of their $${budgetAmount} budget for ${month}.
    Total expenses so far: $${expenses}.

    Focus on:
    - Clear, step-by-step actions the user should take regarding their expenses and savings.
    - If they are close to the limit (80-100%), suggest where to cut back immediately.
    - If they are over the limit (>100%), suggest how to handle the deficit.
    - Keep it highly encouraging, practical, and easy to understand.

    Format the response as a JSON array of exactly 5 strings, like this:
    ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]
  `;

  try {
    const text = await generateWithFallback(prompt);
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating budget insights:", error);
    return [
      "Review your recent expenses to identify non-essential spending.",
      "Pause any automated subscriptions for the rest of the month.",
      "Try to cook meals at home instead of dining out to save immediately.",
      "Avoid any large purchases until your budget resets next month.",
      "Keep track of your daily spending limits to stay on track.",
    ];
  }
}
