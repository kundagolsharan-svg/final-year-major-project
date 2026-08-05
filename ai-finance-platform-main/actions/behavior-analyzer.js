"use server";

import { db } from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ollama";
import { getAuthUser } from "@/lib/auth-cache";
import { getFromAICache, setInAICache } from "@/lib/ai-cache";

export async function getBehaviorAnalysis(forceRefresh = false) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error("Unauthorized");

    const cacheKey = `behavior-insights-${authUser.id}`;
    if (!forceRefresh) {
      const cached = getFromAICache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        transactions: {
          where: { type: "EXPENSE" },
          orderBy: { date: "desc" },
          take: 150,
        },
      },
    });

    if (!user || !user.transactions || user.transactions.length === 0) {
      const emptyResult = { 
        analysis: "Not enough transaction data to analyze yet. Start adding your expenses to see insights!",
        categoryTotals: {} 
      };
      return emptyResult;
    }

    const categoryTotals = user.transactions.reduce((acc, t) => {
      const cat = t.category;
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {});

    const prompt = `
      Analyze the following financial behavior for ${user.name || "the user"}:
      
      Spending Summary by Category:
      ${Object.entries(categoryTotals).map(([cat, total]) => `- ${cat}: ₹${total.toFixed(2)}`).join("\n")}
      
      Recent Transactions:
      ${user.transactions.slice(0, 20).map(t => `- ${new Date(t.date).toLocaleDateString()}: ${t.description} (₹${Number(t.amount).toFixed(2)})`).join("\n")}
      
      Please provide:
      1. **Spending Patterns**: What are the main habits?
      2. **Trend Detection**: Are there any irregular or increasing costs?
      3. **Actionable Insights**: 3 specific tips to improve financial health based on this data.
      
      Format the response using professional markdown with a premium, insightful tone.
    `;

    const analysis = await generateWithFallback(prompt);
    const result = { 
      analysis, 
      categoryTotals 
    };

    // Cache the result for 15 minutes
    setInAICache(cacheKey, result, 15 * 60 * 1000);

    return result;
  } catch (error) {
    console.error("Behavior Analysis Error:", error);
    throw new Error(error.message || "Failed to generate behavior analysis");
  }
}

export async function getAnalyticsData() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        transactions: {
          where: { type: "EXPENSE" },
        },
      },
    });

    if (!user) {
      return { categoryTotals: {} };
    }

    const categoryTotals = user.transactions.reduce((acc, t) => {
      const cat = t.category;
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {});

    return { 
      categoryTotals
    };
  } catch (error) {
    console.error("Analytics Error:", error);
    throw new Error("Failed to fetch analytics data");
  }
}
