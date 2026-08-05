"use server";

import { db } from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ollama";
import { getAuthUser } from "@/lib/auth-cache";
import { getFromAICache, setInAICache } from "@/lib/ai-cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function getMonthlyReportData(month, year) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) throw new Error("User not found");

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const serializedTransactions = transactions.map(serializeTransaction);

    // Group by category
    const categoryBreakdown = serializedTransactions.reduce((acc, t) => {
      if (t.type === "EXPENSE") {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});

    // Group by tax category
    const taxBreakdown = serializedTransactions.reduce((acc, t) => {
      if (t.taxCategory) {
        acc[t.taxCategory] = (acc[t.taxCategory] || 0) + t.amount;
      }
      return acc;
    }, {});

    const totalIncome = serializedTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = serializedTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const cacheKey = `report-ai-${user.id}-${year}-${month}`;
    const cachedAiSummary = getFromAICache(cacheKey);

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        categoryBreakdown,
        taxBreakdown,
        transactions: serializedTransactions,
        aiSummary: cachedAiSummary || null,
        period: { month, year }
      },
    };
  } catch (error) {
    console.error("Error fetching report data:", error);
    return { success: false, error: error.message };
  }
}

export async function getMonthlyReportAISummary(month, year, totalIncome, totalExpenses, categoryBreakdown, taxBreakdown) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error("Unauthorized");

    const cacheKey = `report-ai-${authUser.id}-${year}-${month}`;
    const cached = getFromAICache(cacheKey);
    if (cached) {
      return { success: true, aiSummary: cached };
    }

    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1));
    const prompt = `
      You are an expert financial advisor named SAMPAT AI. Summarize this financial data for ${monthName} ${year}:
      Total Income: INR ${totalIncome}
      Total Expenses: INR ${totalExpenses}
      Top Expense Categories: ${JSON.stringify(categoryBreakdown)}
      Tax-relevant Expenses: ${JSON.stringify(taxBreakdown)}
      
      Instructions:
      1. All amounts are in Indian Rupees (INR). Use the "₹" symbol or "INR" in your response.
      2. Provide a brief, professional summary (max 3-4 sentences) of the month's performance.
      3. Provide 3-5 SPECIFIC, ACTIONABLE recommendations to improve money flow, cut unnecessary costs, and increase savings based on this data. Format the recommendations clearly.
    `;

    const aiSummary = await generateWithFallback(prompt);
    setInAICache(cacheKey, aiSummary, 30 * 60 * 1000); // 30 minutes cache

    return {
      success: true,
      aiSummary,
    };
  } catch (error) {
    console.error("Error generating report AI summary:", error);
    return {
      success: false,
      aiSummary: "AI summary currently unavailable. Please check your AI service or try again.",
    };
  }
}
