"use server";

import { db } from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ollama";
import { getAuthUser } from "@/lib/auth-cache";
import { getFromAICache, setInAICache } from "@/lib/ai-cache";

export async function getBehaviorAnalysis(forceRefresh = false) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return {
        empty: true,
        message: "Please sign in to view your personalized AI insights.",
        categoryTotals: {},
      };
    }

    const cacheKey = `behavior-insights-v2-${authUser.id}`;
    if (!forceRefresh) {
      const cached = getFromAICache(cacheKey);
      if (cached) return cached;
    }

    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        transactions: {
          where: { type: "EXPENSE" },
          orderBy: { date: "desc" },
          take: 150,
        },
        budgets: true,
      },
    });

    if (!user || !user.transactions || user.transactions.length === 0) {
      return {
        empty: true,
        message: "Not enough transaction data to analyze yet. Start adding your expenses to see AI insights!",
        categoryTotals: {},
      };
    }

    const categoryTotals = user.transactions.reduce((acc, t) => {
      const cat = t.category;
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {});

    const totalSpend = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const budgetAmount = user.budgets ? Number(user.budgets.amount) : null;

    const prompt = `
You are a senior financial intelligence engine for SAMPAT, an Indian personal finance platform.
Analyze the user's expense data and return ONLY a valid raw JSON object — no markdown, no code fences, no explanation.

USER: ${user.name || "User"}
TOTAL EXPENSE: ₹${totalSpend.toFixed(2)}
MONTHLY BUDGET: ${budgetAmount ? `₹${budgetAmount.toFixed(2)}` : "Not set"}
BUDGET UTILIZATION: ${budgetAmount ? `${((totalSpend / budgetAmount) * 100).toFixed(1)}%` : "N/A"}
BUDGET REMAINING: ${budgetAmount ? `₹${Math.max(0, budgetAmount - totalSpend).toFixed(2)}` : "N/A"}

SPENDING BY CATEGORY (sorted highest to lowest):
${Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, total]) => `- ${cat}: ₹${total.toFixed(2)} (${((total / totalSpend) * 100).toFixed(1)}%)`)
        .join("\n")}

RECENT 20 TRANSACTIONS:
${user.transactions
        .slice(0, 20)
        .map(t => `- ${new Date(t.date).toLocaleDateString("en-IN")}: ${t.description || t.category} ₹${Number(t.amount).toFixed(2)}`)
        .join("\n")}

Return this exact JSON (all fields required, use ₹ and Indian number formatting):
{
  "healthScore": <integer 0-100>,
  "healthLabel": "<Excellent|Good|Fair|Needs Attention>",
  "summary": "<3-4 sentence executive overview of this user's financial behavior, referencing actual ₹ amounts and category names>",

  "patterns": [
    {
      "title": "<pattern title>",
      "description": "<2-3 sentence detailed insight referencing actual data>",
      "severity": "<positive|neutral|warning>",
      "impact": "<High|Medium|Low>",
      "dataPoint": "<a specific ₹ figure or % from the data that supports this pattern>"
    },
    { "title": "...", "description": "...", "severity": "...", "impact": "...", "dataPoint": "..." },
    { "title": "...", "description": "...", "severity": "...", "impact": "...", "dataPoint": "..." },
    { "title": "...", "description": "...", "severity": "...", "impact": "...", "dataPoint": "..." },
    { "title": "...", "description": "...", "severity": "...", "impact": "...", "dataPoint": "..." }
  ],

  "trends": [
    {
      "label": "<trend name>",
      "direction": "<up|down|stable>",
      "detail": "<2 sentence explanation of why this trend is occurring and its financial implication>",
      "velocity": "<Fast|Moderate|Slow>"
    },
    { "label": "...", "direction": "...", "detail": "...", "velocity": "..." },
    { "label": "...", "direction": "...", "detail": "...", "velocity": "..." }
  ],

  "tips": [
    {
      "priority": "high",
      "title": "<concise tip title>",
      "action": "<2-3 sentence specific step-by-step action plan with actual ₹ amounts>",
      "estimatedSaving": "<estimated monthly saving e.g. ₹2,000>"
    },
    {
      "priority": "medium",
      "title": "...",
      "action": "...",
      "estimatedSaving": "..."
    },
    {
      "priority": "low",
      "title": "...",
      "action": "...",
      "estimatedSaving": "..."
    }
  ],

  "budgetAnalysis": {
    "status": "<On Track|Warning|Over Budget|No Budget Set>",
    "commentary": "<2-3 sentences analyzing budget usage and what it means for this user>",
    "suggestion": "<one specific actionable budget suggestion>"
  },

  "behavioralProfile": {
    "type": "<e.g. Lifestyle Spender|Essentials-First|Impulse Buyer|Balanced Planner|Conservative Saver>",
    "description": "<3-4 sentences describing this user's financial personality based on data>",
    "strength": "<their biggest financial strength>",
    "weakness": "<their biggest financial weakness>"
  },

  "categoryInsights": [
    {
      "category": "<top category name>",
      "amount": "<₹ amount>",
      "pct": <percentage as number>,
      "insight": "<2 sentence specific insight about this category spend>",
      "isOverspending": <true|false>
    },
    {
      "category": "<2nd category>",
      "amount": "...",
      "pct": <number>,
      "insight": "...",
      "isOverspending": <true|false>
    },
    {
      "category": "<3rd category>",
      "amount": "...",
      "pct": <number>,
      "insight": "...",
      "isOverspending": <true|false>
    }
  ],

  "topCategory": "<highest spend category>",
  "topCategoryPct": <number>
}
`;

    const raw = await generateWithFallback(prompt, false, "json");

    // Extract JSON from response — handles cases where model wraps in markdown
    let structured;
    try {
      // Strip markdown code fences if present
      let cleanRaw = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      
      const jsonMatch = cleanRaw.match(/\{[\s\S]*\}/);
      structured = JSON.parse(jsonMatch ? jsonMatch[0] : cleanRaw);
    } catch (parseError) {
      console.error("Behavior Analysis JSON Parse Error:", parseError, "Raw output:", raw);
      // Fallback: return raw analysis as plain text
      structured = {
        healthScore: 70,
        healthLabel: "Good",
        summary: raw.slice(0, 500),
        patterns: [],
        trends: [],
        tips: [],
        budgetAnalysis: { status: "N/A", commentary: "", suggestion: "" },
        behavioralProfile: { type: "Balanced Planner", description: raw.slice(0, 300), strength: "", weakness: "" },
        categoryInsights: [],
        topCategory: Object.keys(categoryTotals)[0] || "N/A",
        topCategoryPct: 0,
      };
    }


    const result = { structured, categoryTotals, totalSpend, budgetAmount };
    setInAICache(cacheKey, result, 15 * 60 * 1000);
    return result;
  } catch (error) {
    const msg = typeof error?.message === "string" ? error.message : "Failed to generate behavior analysis";
    console.error("Behavior Analysis Error:", msg);
    throw new Error(msg);
  }
}

export async function getAnalyticsData() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return { categoryTotals: {} };

    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: { transactions: { where: { type: "EXPENSE" } } },
    });

    if (!user) return { categoryTotals: {} };

    const categoryTotals = user.transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

    return { categoryTotals };
  } catch (error) {
    console.error("Analytics Error:", error);
    throw new Error("Failed to fetch analytics data");
  }
}
