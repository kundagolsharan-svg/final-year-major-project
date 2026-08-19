"use server";

import { db } from "@/lib/prisma";
import { generateWithFallback as ollamaGenerate } from "@/lib/ollama";
import { generateWithFallback as geminiGenerate } from "@/lib/gemini";
import { getAuthUser } from "@/lib/auth-cache";

export async function getUserFinancialSummaryForChat() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return null;

    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        accounts: true,
        transactions: {
          orderBy: { date: "desc" },
          take: 100,
        },
        budgets: true,
        goals: true,
      },
    });

    if (!user) return null;

    const totalBalance = (user.accounts || []).reduce(
      (sum, a) => sum + Number(a.balance || 0),
      0
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthTxns = user.transactions.filter(
      (t) => new Date(t.date) >= startOfMonth
    );

    const monthlyIncome = currentMonthTxns
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const monthlyExpense = currentMonthTxns
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const netSavings = monthlyIncome - monthlyExpense;
    const savingsRate =
      monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;

    return {
      userName: user.name || "Finance Leader",
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netSavings,
      savingsRate,
      accountsCount: (user.accounts || []).length,
      goalsCount: (user.goals || []).length,
      budgetAmount: user.budgets ? Number(user.budgets.amount || 0) : null,
      transactionsCount: user.transactions.length,
    };
  } catch (err) {
    console.error("Failed to get summary for chat:", err);
    return null;
  }
}

export async function getChatResponse(message, conversationHistory = []) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        accounts: true,
        transactions: {
          orderBy: { date: "desc" },
          take: 100,
        },
        budgets: true,
        goals: true,
      },
    });

    if (!user) throw new Error("User not found");

    // Build comprehensive financial context
    const totalBalance = (user.accounts || []).reduce(
      (sum, a) => sum + Number(a.balance || 0),
      0
    );
    const totalIncome = user.transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = user.transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Group spending by category
    const categorySpending = {};
    user.transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        categorySpending[t.category] =
          (categorySpending[t.category] || 0) + Number(t.amount);
      });

    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString("en-IN")}`)
      .join(", ");

    const goalsSummary = (user.goals || [])
      .map(
        (g) =>
          `- ${g.name}: Target ₹${Number(g.targetAmount).toLocaleString("en-IN")}, Saved ₹${Number(g.currentAmount).toLocaleString("en-IN")} (${Math.round((Number(g.currentAmount) / (Number(g.targetAmount) || 1)) * 100)}%)`
      )
      .join("\n");

    const context = `
User Name: ${user.name || "User"}
Total Balance Across Accounts: ₹${totalBalance.toLocaleString("en-IN")}
Accounts: ${(user.accounts || []).map((a) => `${a.name} (${a.type}): ₹${Number(a.balance).toLocaleString("en-IN")}`).join(", ") || "No accounts registered"}
Total Inflow (from transactions): ₹${totalIncome.toLocaleString("en-IN")}
Total Outflow (from transactions): ₹${totalExpense.toLocaleString("en-IN")}
Net Position: ₹${(totalIncome - totalExpense).toLocaleString("en-IN")}
Active Budget: ${user.budgets ? `₹${Number(user.budgets.amount).toLocaleString("en-IN")}` : "No budget currently set"}
Top Spending Categories: ${topCategories || "No categorized expenses yet"}
Financial Goals:
${goalsSummary || "No active goals created yet."}

Recent 20 Ledger Records:
${user.transactions
  .slice(0, 20)
  .map(
    (t) =>
      `- ${new Date(t.date).toLocaleDateString("en-IN")}: ${t.description || "Txn"} | ${t.category} | ${t.type === "EXPENSE" ? "-" : "+"}₹${Number(t.amount).toLocaleString("en-IN")}`
  )
  .join("\n")}
    `.trim();

    // Build conversation history string
    const historyStr =
      conversationHistory.length > 0
        ? conversationHistory
            .slice(-10) // keep last 10 messages for context
            .map(
              (m) =>
                `${m.role === "user" ? "User" : "SAMPAT AI"}: ${m.content}`
            )
            .join("\n")
        : "";

    const currentHourIst = parseInt(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: 'numeric', hour12: false }));
    let greeting = "Good morning";
    if (currentHourIst >= 12 && currentHourIst < 17) greeting = "Good afternoon";
    else if (currentHourIst >= 17 || currentHourIst < 4) greeting = "Good evening";

    const prompt = `
You are SAMPAT AI, the executive AI wealth and financial intelligence advisor built into the SAMPAT platform.

YOUR CAPABILITIES & TONE:
1. **Personal Finance Director**: Deliver highly structured, data-backed insights on user's real transactions, accounts, categories, and goals.
2. **Wealth & Strategy Consultant**: Provide smart, actionable advice for budgeting, tax saving, investments (SIP, Mutual Funds, Emergency Funds, Debt Reduction), and daily spending optimizations.
3. **Executive Presentation**:
   - Use clean Markdown formatting with clear bold headings, structured comparison tables where helpful, bullet points, and key metrics.
   - Always use ₹ (Indian Rupee symbol) and Indian comma notation (e.g. ₹1,50,000) for all monetary values.
   - Be authoritative, empathetic, concise, and clear.
4. **Proactive Suggestion Engine**: At the very END of your response, always provide a section formatted exactly as:
💡 You might also want to ask:
1. [Specific context-relevant follow up question]
2. [Specific context-relevant follow up question]
3. [Specific context-relevant follow up question]
5. **Spoken Summary**: At the very beginning of your response, ALWAYS provide a concise, spoken summary designed for Text-to-Speech (TTS) wrapped in \`<spoken_summary>...</spoken_summary>\` tags. This summary MUST NOT read the whole response. It should only explain the main content, actionable steps, and suggestions. It MUST start with the greeting "${greeting}" and MUST end with "Thank you". Do not include formatting like markdown or tables in this tag.

USER'S LIVE FINANCIAL PROFILE & LEDGER:
${context}

${historyStr ? `PRIOR CONVERSATION CONTEXT:\n${historyStr}\n` : ""}
User Query: ${message}

Deliver your response as SAMPAT AI:`;

    // Try Ollama (which automatically falls back to Gemini if unavailable)
    let aiResponse;
    try {
      aiResponse = await ollamaGenerate(prompt);
      console.log("[Chat] AI generation successful");
    } catch (aiError) {
      console.warn("[Chat] AI services failed:", aiError.message);
      return { 
        success: true, 
        response: "I apologize, but my AI services are currently unavailable. If you are accessing this from another device without local AI, the cloud AI fallback (Gemini) may have reached its usage limits. If you are on the host machine, please ensure Ollama is running." 
      };
    }

    return { success: true, response: aiResponse };
  } catch (error) {
    console.error("Chat Error:", error);
    return { success: false, error: error.message || "Failed to get AI response" };
  }
}
