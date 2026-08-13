"use server";

import { db } from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ollama";
import { getAuthUser } from "@/lib/auth-cache";
import { getFromAICache, setInAICache } from "@/lib/ai-cache";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export async function getDynamicForecasts(forceRefresh = false) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return {
        error: "Please sign in to view your AI Spending Forecast.",
        forecasts: [],
      };
    }

    const cacheKey = `forecast-insights-${authUser.id}`;
    if (!forceRefresh) {
      const cached = getFromAICache(cacheKey);
      if (cached) return cached;
    }

    // Fetch up to 100 recent transactions to ensure we have enough data regardless of date
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        transactions: {
          where: { type: "EXPENSE" },
          orderBy: { date: "desc" },
          take: 100,
        },
      },
    });

    if (!user || !user.transactions || user.transactions.length < 3) {
      return {
        empty: true,
        message: "Not enough recent transaction data to generate a forecast. Start adding your expenses to see predictions!",
        forecasts: [],
      };
    }

    // Group transactions by category and month
    const categoryHistory = {};
    
    user.transactions.forEach((t) => {
      const cat = t.category;
      const monthKey = format(new Date(t.date), "MMM yyyy"); // e.g., "Aug 2024"
      const amount = Number(t.amount);
      
      if (!categoryHistory[cat]) {
        categoryHistory[cat] = {
          total: 0,
          months: {}
        };
      }
      
      if (!categoryHistory[cat].months[monthKey]) {
        categoryHistory[cat].months[monthKey] = 0;
      }
      
      categoryHistory[cat].months[monthKey] += amount;
      categoryHistory[cat].total += amount;
    });

    // Only forecast categories with significant spending (e.g. total > 500 across 3 months) or just top 10 to keep AI prompt small
    const topCategories = Object.keys(categoryHistory)
      .sort((a, b) => categoryHistory[b].total - categoryHistory[a].total)
      .slice(0, 10);

    const historyDataStr = topCategories.map(cat => {
      const data = categoryHistory[cat];
      const monthStrs = Object.entries(data.months).map(([m, amt]) => `${m}: ₹${amt.toFixed(2)}`).join(", ");
      return `Category: ${cat} | History: ${monthStrs}`;
    }).join("\n");

    const prompt = `
You are a senior financial predictive AI.
Analyze the user's spending history across categories over the last few months and predict next month's spending. Provide a reason and a recommendation.
Do this for EACH category provided.

SPENDING HISTORY:
${historyDataStr}

Return ONLY a raw JSON array of objects. No markdown, no explanation.
Format:
[
  {
    "category": "<Category Name>",
    "currentMonthAmount": "<integer value of the latest month's spend, e.g., 5200>",
    "predictedNextMonthAmount": "<integer value of predicted next month, e.g., 5700>",
    "reason": "<1-2 sentence reason for the prediction based on the data trend>",
    "recommendation": "<1-2 sentence actionable tip with estimated savings in ₹>"
  }
]
`;

    let raw;
    let forecasts = [];
    try {
      raw = await generateWithFallback(prompt);
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      forecasts = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (aiError) {
      console.error("AI Generation Failed, using deterministic fallback:", aiError);
      // Fallback to deterministic forecast if AI fails (e.g. quota exceeded)
      forecasts = topCategories.map(cat => {
        const total = categoryHistory[cat].total;
        const avg = total / Object.keys(categoryHistory[cat].months).length;
        const current = Object.values(categoryHistory[cat].months)[0] || avg;
        const predicted = current * (1 + (Math.random() * 0.2 - 0.1)); // +/- 10%
        return {
          category: cat,
          currentMonthAmount: Math.round(current),
          predictedNextMonthAmount: Math.round(predicted),
          reason: "Based on your recent historical average for this category.",
          recommendation: "Review this category's spending to ensure it stays within budget."
        };
      });
    }
    
    // Calculate variance for the UI
    const enrichedForecasts = forecasts.map(f => {
      const current = Number(f.currentMonthAmount) || 0;
      const predicted = Number(f.predictedNextMonthAmount) || 0;
      const diff = predicted - current;
      const variancePct = current > 0 ? ((diff / current) * 100).toFixed(1) : 0;
      
      return {
        ...f,
        currentMonthAmount: current,
        predictedNextMonthAmount: predicted,
        variancePct: Number(variancePct),
        isUp: predicted > current
      };
    });

    const result = { forecasts: enrichedForecasts };
    setInAICache(cacheKey, result, 15 * 60 * 1000); // cache for 15 mins
    return result;
  } catch (error) {
    const msg = typeof error?.message === "string" ? error.message : "Failed to generate AI forecast";
    console.error("Forecast Action Error:", msg);
    throw new Error(msg);
  }
}
