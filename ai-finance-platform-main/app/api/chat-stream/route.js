import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

async function getWorkingOllamaUrl() {
  const isVercel = !!process.env.VERCEL;
  let urls = [];
  if (isVercel) {
    urls = [OLLAMA_URL, "http://127.0.0.1:11434", "http://localhost:11434"].filter(Boolean);
  } else {
    urls = ["http://127.0.0.1:11434", "http://localhost:11434", OLLAMA_URL].filter(Boolean);
  }
  if (process.env.OLLAMA_API_KEY && !urls.includes("https://ollama.com")) {
    urls.push("https://ollama.com");
  }
  for (const url of [...new Set(urls)]) {
    try {
      const headers = {
        "Bypass-Tunnel-Reminder": "true",
        "User-Agent": "sampat-server"
      };
      if (process.env.OLLAMA_API_KEY && !url.includes("127.0.0.1") && !url.includes("localhost")) {
        headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
      }
      const res = await fetch(`${url}/api/tags`, { 
        headers,
        signal: AbortSignal.timeout(5000) 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.models?.length > 0) return { url, models: data.models.map(m => m.name) };
      }
    } catch {}
  }

  if (process.env.OLLAMA_API_KEY) {
    const cloudUrl = OLLAMA_URL || "https://ollama.com";
    return { url: cloudUrl, models: ["llama3.2"] };
  }
  return null;
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history } = await request.json();

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        accounts: true,
        transactions: { orderBy: { date: "desc" }, take: 100 },
        budgets: true,
        goals: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Build financial context
    const totalBalance = (user.accounts || []).reduce((sum, a) => sum + Number(a.balance || 0), 0);
    const totalIncome = user.transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = user.transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + Number(t.amount), 0);

    const categorySpending = {};
    user.transactions.filter(t => t.type === "EXPENSE").forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
    });
    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString("en-IN")}`).join(", ");

    const goalsSummary = (user.goals || [])
      .map(g => `- ${g.name}: Target ₹${Number(g.targetAmount).toLocaleString("en-IN")}, Saved ₹${Number(g.currentAmount).toLocaleString("en-IN")} (${Math.round((Number(g.currentAmount) / (Number(g.targetAmount) || 1)) * 100)}%)`)
      .join("\n");

    const context = `
User Name: ${user.name || "User"}
Total Balance Across Accounts: ₹${totalBalance.toLocaleString("en-IN")}
Accounts: ${(user.accounts || []).map(a => `${a.name} (${a.type}): ₹${Number(a.balance).toLocaleString("en-IN")}`).join(", ") || "No accounts"}
Total Inflow: ₹${totalIncome.toLocaleString("en-IN")}
Total Outflow: ₹${totalExpense.toLocaleString("en-IN")}
Active Budget: ${user.budgets ? `₹${Number(user.budgets.amount).toLocaleString("en-IN")}` : "Not set"}
Top Spending Categories: ${topCategories || "None"}
Financial Goals:\n${goalsSummary || "None"}
Recent 20 Transactions:\n${user.transactions.slice(0, 20).map(t => `- ${new Date(t.date).toLocaleDateString("en-IN")}: ${t.description || "Txn"} | ${t.category} | ${t.type === "EXPENSE" ? "-" : "+"}₹${Number(t.amount).toLocaleString("en-IN")}`).join("\n")}
    `.trim();

    const systemPrompt = `You are SAMPAT AI, the executive AI wealth and financial intelligence advisor built into the SAMPAT platform.

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

USER'S LIVE FINANCIAL PROFILE & LEDGER:
${context}`;

    // Build messages array for Ollama chat API
    const historyStr = (history || []).slice(-8);
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...historyStr,
      { role: "user", content: message },
    ];

    // Find working Ollama
    const ollamaInfo = await getWorkingOllamaUrl();
    if (!ollamaInfo) {
      return NextResponse.json({ error: "Ollama is not running. Please start Ollama." }, { status: 503 });
    }

    const preferredModels = ["llama3.2", "llama3", "mistral", "gemma", "qwen", "phi3"];
    const sortedModels = ollamaInfo.models.sort((a, b) => {
      const aPref = preferredModels.findIndex(p => a.includes(p));
      const bPref = preferredModels.findIndex(p => b.includes(p));
      if (aPref !== -1 && bPref !== -1) return aPref - bPref;
      if (aPref !== -1) return -1;
      if (bPref !== -1) return 1;
      return 0;
    });
    const modelName = sortedModels[0];

    console.log(`[Stream Chat] Using ${modelName} on ${ollamaInfo.url}`);

    const headers = { 
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true",
      "User-Agent": "sampat-server"
    };
    if (process.env.OLLAMA_API_KEY && !ollamaInfo.url.includes("127.0.0.1") && !ollamaInfo.url.includes("localhost")) {
      headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
    }

    const ollamaRes = await fetch(`${ollamaInfo.url}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: modelName, messages: ollamaMessages, stream: true }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama returned ${ollamaRes.status}`);
    }

    // Pipe Ollama's NDJSON stream → transform to plain text → SSE
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                const token = json.message?.content || "";
                if (token) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
                if (json.done) {
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                }
              } catch {}
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("[Stream Chat Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
