import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { generateWithFallback } from "@/lib/ollama";

// 1. Recurring Transaction Processing with Throttling
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Process 10 transactions
      period: "1m", // per minute
      key: "event.data.userId", // Throttle per user
    },
    event: "transaction.recurring.process",
  },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      // Create new transaction and update account balance in a transaction
      await db.$transaction(async (tx) => {
        // Create new transaction
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        // Update account balance
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update last processed date and next recurring date
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

// Trigger recurring transactions with batching
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions", // Unique ID,
    name: "Trigger Recurring Transactions",
    cron: "0 0 * * *", // Daily at midnight
  },
  async ({ step }) => {
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(),
                },
              },
            ],
          },
        });
      }
    );

    // Send event for each recurring transaction in batches
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Send events directly using inngest.send()
      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

// 2. Monthly Report Generation
async function generateFinancialInsights(stats, month) {
  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: ₹${stats.totalIncome}
    - Total Expenses: ₹${stats.totalExpenses}
    - Net Income: ₹${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ₹${amount}`)
      .join(", ")}
    `;
    try {
      const text = await generateWithFallback(prompt);
      const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Error generating insights:", error);
      return [
        "Review your highest expense category this month for savings opportunities.",
        "Consider setting up automatic transfers to boost your savings rate.",
        "Track your recurring expenses to identify subscriptions you no longer use.",
      ];
    }
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
    cron: "0 0 1 * *", // First day of each month
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: { accounts: true },
      });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        // Generate AI insights
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

// 3. Budget Alerts
async function generateBudgetInsights(expenses, budgetAmount, month) {
  const percentageUsed = (expenses / budgetAmount) * 100;

  const prompt = `
    Analyze this budget situation and provide 2 concise, helpful financial advice / insights.
    The user has used ${percentageUsed.toFixed(1)}% of their ₹${budgetAmount} budget for ${month}.
    Total expenses so far: ₹${expenses}.

    Focus on:
    - If they are close to the limit (80-100%), suggest where to cut back.
    - If they are over the limit (>100%), suggest how to handle the deficit.
    - Keep it encouraging and practical.

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2"]
  `;

  try {
    const text = await generateWithFallback(prompt);
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating budget insights:", error);
    return [
      "Consider reviewing your recent expenses to identify non-essential spending.",
      "Try to keep your daily spending in check for the rest of the month.",
    ];
  }
}

export const checkBudgetAlerts = inngest.createFunction(
  { 
    id: "check-budget-alerts", 
    name: "Check Budget Alerts",
    event: "budget.check",
  },
  async ({ event, step }) => {
    const { userId } = event.data;
    console.log("Budget check triggered for user:", userId);

    const budget = await step.run("fetch-budget", async () => {
      return await db.budget.findUnique({
        where: { userId },
        include: {
          user: {
            include: {
              accounts: true,
            },
          },
        },
      });
    });

    console.log("Budget found:", budget ? "Yes" : "No");
    if (!budget || budget.user.accounts.length === 0) {
      console.log("No budget or no accounts found for user:", userId);
      return;
    }

    const defaultAccount =
      budget.user.accounts.find((acc) => acc.isDefault) ||
      budget.user.accounts[0];
    
    console.log("Using account for budget check:", defaultAccount.name, defaultAccount.id);

    const budgetAmount = budget.amount.toNumber();

    await step.run("check-threshold", async () => {
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

      // Fixed threshold to 80% as per user request
      if (percentageUsed >= 80) {
        console.log("Threshold exceeded! Sending email...");
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

        // Update last alert sent
        await db.budget.update({
          where: { id: budget.id },
          data: { lastAlertSent: new Date() },
        });
      } else {
        console.log("Threshold not reached (current: " + percentageUsed.toFixed(1) + "%)");
      }
    });
  }
);

// Monthly Cron to check all budgets
export const triggerBudgetChecks = inngest.createFunction(
  { 
    id: "trigger-budget-checks", 
    name: "Trigger Budget Checks",
    cron: "0 */6 * * *", // Still run every 6 hours as a fallback
  },
  async ({ step }) => {
    const budgets = await step.run("fetch-all-budgets", async () => {
      return await db.budget.findMany({ select: { userId: true } });
    });

    if (budgets.length > 0) {
      const events = budgets.map((budget) => ({
        name: "budget.check",
        data: { userId: budget.userId },
      }));

      await inngest.send(events);
    }

    return { triggered: budgets.length };
  }
);

function _isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

// Utility functions
function isTransactionDue(transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  // Compare with nextDue date
  return nextDue <= today;
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}
