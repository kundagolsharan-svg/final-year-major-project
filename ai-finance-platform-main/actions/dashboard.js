"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth-cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function getUserAccounts() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Serialize accounts before sending to client
    const serializedAccounts = accounts.map(serializeTransaction);

    return serializedAccounts;
  } catch (error) {
    console.error(error.message);
  }
}

export async function createAccount(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Convert balance to float before saving
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // Check if this is the user's first account
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    // If it's the first account, make it default regardless of user input
    // If not, use the user's preference
    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // If this account should be default, unset other default accounts
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new account
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault, // Override the isDefault based on our logic
      },
    });

    // Serialize the account before returning
    const serializedAccount = serializeTransaction(account);

    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getDashboardData() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Get all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}

export async function getFinancialHealthScore() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const defaultAccount = await db.account.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    if (!defaultAccount) {
      return { score: 0, status: "Unknown", description: "No default account found" };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await db.transaction.findMany({
      where: {
        accountId: defaultAccount.id,
        date: { gte: thirtyDaysAgo },
      },
    });

    let income = 0;
    let expenses = 0;

    for (const t of transactions) {
      const amount = t.amount.toNumber();
      if (t.type === "INCOME") {
        income += amount;
      } else if (t.type === "EXPENSE") {
        expenses += amount;
      }
    }

    const balance = defaultAccount.balance.toNumber();
    let score = 50; // base score

    // Savings Rate (up to 25 points)
    if (income > 0) {
      const savingsRate = (income - expenses) / income;
      const ratePoints = Math.max(0, Math.min(25, (savingsRate / 0.2) * 25));
      score += ratePoints;
    } else if (expenses > 0 && income === 0) {
      score -= 10;
    }

    // Emergency Buffer (up to 25 points)
    if (expenses > 0) {
      const bufferMonths = balance / expenses;
      const bufferPoints = Math.max(0, Math.min(25, (bufferMonths / 3) * 25));
      score += bufferPoints;
    } else if (balance > 0) {
      score += 25; 
    }

    // EMI Burden (up to 20 points)
    const recurringExpenses = transactions
      .filter(t => t.isRecurring && t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);
    
    if (income > 0) {
      const emiBurden = recurringExpenses / income;
      const emiPoints = Math.max(0, Math.min(20, (1 - (emiBurden / 0.4)) * 20));
      score += emiPoints;
    }

    score = Math.round(Math.max(0, Math.min(100, score)));

    let status = "Needs Attention";
    let description = "Your spending is high relative to your income and balance. Try cutting unnecessary expenses.";
    
    if (score >= 80) {
      status = "Excellent";
      description = "Great job! You have a strong savings rate, manageable debt, and a healthy emergency buffer.";
    } else if (score >= 60) {
      status = "Good";
      description = "You're doing well, but there's room to increase your savings or reduce recurring costs.";
    } else if (score >= 40) {
      status = "Fair";
      description = "You're on track, but could improve your financial health by increasing savings and building a buffer.";
    }

    // Emergency Fund Recommendation
    const monthlyAvgExpense = expenses || (balance / 6); // fallback to 1/6th of balance as rough estimate
    const recommendedBuffer = monthlyAvgExpense * 6;
    const currentBuffer = balance;
    const bufferGap = Math.max(0, recommendedBuffer - currentBuffer);

    return {
      score,
      status,
      description,
      metrics: {
        income,
        expenses,
        balance,
        recurringExpenses,
        savingsRate: income > 0 ? (income - expenses) / income : 0,
        emergencyFund: {
          current: currentBuffer,
          recommended: recommendedBuffer,
          gap: bufferGap,
          status: currentBuffer >= recommendedBuffer ? "Full" : currentBuffer >= recommendedBuffer / 2 ? "Partial" : "Low"
        }
      }
    };
  } catch (error) {
    console.error("Financial Health Score Error:", error);
    return { score: 0, status: "Unknown", description: "Failed to calculate score" };
  }
}
export async function getUpcomingBills() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);

    const upcomingBills = await db.transaction.findMany({
      where: {
        userId: user.id,
        isRecurring: true,
        type: "EXPENSE",
        nextRecurringDate: {
          gte: now,
          lte: twoWeeksFromNow,
        },
      },
      include: {
        account: true,
      },
      orderBy: {
        nextRecurringDate: "asc",
      },
    });

    return upcomingBills.map(serializeTransaction);
  } catch (error) {
    console.error("Error fetching upcoming bills:", error);
    return [];
  }
}
export async function getSpendingInsights() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch transactions for both months
    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: { gte: lastMonthStart },
      },
    });

    const currentMonthSpending = {};
    const lastMonthSpending = {};

    transactions.forEach(t => {
      const amount = t.amount.toNumber();
      const date = new Date(t.date);
      const category = t.category;

      if (date >= currentMonthStart) {
        currentMonthSpending[category] = (currentMonthSpending[category] || 0) + amount;
      } else if (date >= lastMonthStart && date <= lastMonthEnd) {
        lastMonthSpending[category] = (lastMonthSpending[category] || 0) + amount;
      }
    });

    const insights = [];
    const categories = new Set([...Object.keys(currentMonthSpending), ...Object.keys(lastMonthSpending)]);

    categories.forEach(category => {
      const current = currentMonthSpending[category] || 0;
      const last = lastMonthSpending[category] || 0;

      if (current > last && last > 0) {
        const increase = current - last;
        const percent = ((increase / last) * 100).toFixed(1);
        insights.push({
          category,
          current,
          last,
          increase,
          percent,
          type: "WARNING",
          message: `You've spent ₹${increase.toLocaleString("en-IN")} more on ${category} than last month (${percent}% increase).`
        });
      }
    });

    return insights;
  } catch (error) {
    console.error("Error fetching spending insights:", error);
    return [];
  }
}
