"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateWithFallback } from "@/lib/ollama";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { inngest } from "@/lib/inngest/client";
import { checkBudgetAlert } from "./budget";
import { sendEmail } from "./send-email";
import EmailTemplate from "@/emails/template";
import { getAuthUser } from "@/lib/auth-cache";

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data) {
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

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Calculate new balance
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    // Trigger budget check
    try {
      await checkBudgetAlert(user.id);
    } catch (budgetError) {
      console.error("Failed to check budget:", budgetError);
    }

    try {
      await inngest.send({
        name: "budget.check",
        data: { userId: user.id },
      });
    } catch (inngestError) {
      console.error("Failed to trigger budget check (Inngest):", inngestError);
    }

    // Check for anomalies
    const anomaly = await detectAnomaly(user.id, data.amount, data.category);
    if (anomaly.isAnomaly) {
      console.warn(`Anomaly detected: ${anomaly.reason}`);
      
      // Send email alert for anomaly
      try {
        await sendEmail({
          to: user.email,
          subject: "Suspicious Transaction Alert",
          react: EmailTemplate({
            userName: user.name,
            type: "anomaly-alert",
            data: {
              transaction: {
                ...data,
                date: data.date.toISOString(),
              },
              reason: anomaly.reason,
            },
          }),
        });
      } catch (emailError) {
        console.error("Failed to send anomaly email:", emailError);
      }
    }

    // Check for category spending increase vs last month
    try {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const categorySpending = await db.transaction.groupBy({
        by: ['category'],
        where: {
          userId: user.id,
          type: "EXPENSE",
          category: data.category,
          date: { gte: lastMonthStart },
        },
        _sum: { amount: true },
      });

      // Filter transactions to get current and last month totals for this category
      const currentTransactions = await db.transaction.aggregate({
        where: {
          userId: user.id,
          type: "EXPENSE",
          category: data.category,
          date: { gte: currentMonthStart },
        },
        _sum: { amount: true },
      });

      const lastTransactions = await db.transaction.aggregate({
        where: {
          userId: user.id,
          type: "EXPENSE",
          category: data.category,
          date: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      });

      const currentTotal = currentTransactions._sum.amount?.toNumber() || 0;
      const lastTotal = lastTransactions._sum.amount?.toNumber() || 0;

      // If we just exceeded last month's spending and it wasn't already exceeded
      if (lastTotal > 0 && currentTotal > lastTotal && (currentTotal - data.amount) <= lastTotal) {
        const increase = currentTotal - lastTotal;
        const percent = ((increase / lastTotal) * 100).toFixed(1);
        
        await sendEmail({
          to: user.email,
          subject: `Spending Alert: ${data.category} limit exceeded`,
          react: EmailTemplate({
            userName: user.name,
            type: "spending-increase",
            data: {
              category: data.category,
              current: currentTotal,
              last: lastTotal,
              increase,
              percent
            },
          }),
        });
      }
    } catch (spendingError) {
      console.error("Failed to check spending increase alert:", spendingError);
    }

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { 
      success: true, 
      data: serializeAmount(transaction),
      anomaly: anomaly.isAnomaly ? anomaly.reason : null 
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTransaction(id) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    // Trigger budget check
    try {
      await checkBudgetAlert(user.id);
    } catch (budgetError) {
      console.error("Failed to check budget:", budgetError);
    }

    try {
      await inngest.send({
        name: "budget.check",
        data: { userId: user.id },
      });
    } catch (inngestError) {
      console.error("Failed to trigger budget check (Inngest):", inngestError);
    }

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Scan Receipt
export async function scanReceipt(file) {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string",
        "taxCategory": "string" // One of: rent, medical, education, business, investment, null
      }

      If its not a recipt, return an empty object
    `;

    const contentArray = [
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ];

    const text = await generateWithFallback(contentArray, true);
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
        taxCategory: data.taxCategory,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

// Anomaly Detection helper (MAD approach)
async function detectAnomaly(userId, amount, category) {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await db.transaction.findMany({
      where: {
        userId,
        category,
        type: "EXPENSE",
        date: { gte: threeMonthsAgo },
      },
      select: { amount: true },
    });

    const count = transactions.length;

    // Flat threshold for "Huge Amount" detection (e.g., ₹50,000)
    const HUGE_AMOUNT_THRESHOLD = 50000;
    if (amount >= HUGE_AMOUNT_THRESHOLD) {
      return {
        isAnomaly: true,
        reason: `High Value Alert: This transaction of ₹${amount.toLocaleString("en-IN")} is exceptionally high. Please verify if this was intended.`,
      };
    }

    if (count >= 3) {
      const amounts = transactions.map(t => t.amount.toNumber()).sort((a, b) => a - b);
      const median = amounts[Math.floor(amounts.length / 2)];
      const absDeviations = amounts.map(a => Math.abs(a - median)).sort((a, b) => a - b);
      const mad = absDeviations[Math.floor(absDeviations.length / 2)];

      // If mad is 0, all past values are identical. Any deviation could be anomalous if large enough.
      const modifiedZScore = mad === 0 ? (amount > median * 1.5 ? 4 : 0) : (0.6745 * (amount - median)) / mad;

      if (modifiedZScore > 3.5) {
        return {
          isAnomaly: true,
          reason: `Suspicious activity: This transaction of ₹${amount.toLocaleString("en-IN")} significantly deviates from your typical ${category} spending pattern.`,
        };
      }
    }
    return { isAnomaly: false };
  } catch (error) {
    return { isAnomaly: false };
  }
}

// AI-based Categorization
export async function categorizeTransaction(description) {
  try {
    const prompt = `
      Analyze this transaction description: "${description}"
      Categorize it into:
      1. General category (one of: housing, transportation, groceries, utilities, entertainment, food, shopping, healthcare, education, personal, travel, insurance, gifts, bills, other-expense)
      2. Tax-relevant category (one of: rent, medical, education, business, investment, or null if not applicable)
      
      Respond with ONLY a JSON object:
      {
        "category": "string",
        "taxCategory": "string"
      }
    `;
    const text = await generateWithFallback(prompt, true);
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const data = JSON.parse(cleanedText);
    return {
      category: data.category.toLowerCase(),
      taxCategory: data.taxCategory ? data.taxCategory.toLowerCase() : null
    };
  } catch (error) {
    return {
      category: "other-expense",
      taxCategory: null
    };
  }
}
