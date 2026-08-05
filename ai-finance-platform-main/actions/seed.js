"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

const ACCOUNT_ID = "account-id";
const USER_ID = "user-id";

// Categories with their typical amount ranges
const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

// Helper to generate random amount within a range
function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Helper to get random category with amount
function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions() {
  try {
    // Generate 90 days of transactions
    const transactions = [];
    let totalBalance = 0;

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);

      // Generate 1-3 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        // 40% chance of income, 60% chance of expense
        const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);

        const transaction = {
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${
            type === "INCOME" ? "Received" : "Paid for"
          } ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          createdAt: date,
          updatedAt: date,
        };

        totalBalance += type === "INCOME" ? amount : -amount;
        transactions.push(transaction);
      }
    }

    // Insert transactions in batches and update account balance
    await db.$transaction(async (tx) => {
      // Clear existing transactions
      await tx.transaction.deleteMany({
        where: { accountId: ACCOUNT_ID },
      });

      // Insert new transactions
      await tx.transaction.createMany({
        data: transactions,
      });

      // Update account balance
      await tx.account.update({
        where: { id: ACCOUNT_ID },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions`,
    };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
}

export async function mockConnectBank() {
  try {
    console.log("[MOCK] Starting mockConnectBank...");
    console.log("[MOCK] Calling auth()...");
    const { userId } = await auth();
    console.log("[MOCK] userId:", userId);
    if (!userId) throw new Error("Unauthorized");

    console.log("[MOCK] Fetching DB User...");
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    
    if (!user) {
      throw new Error("User not found in database.");
    }
    const dbUserId = user.id;

    console.log("[MOCK] Calling findFirst...");
    let account = await db.account.findFirst({
      where: { userId: dbUserId, name: "HDFC Bank (Auto Synced)" },
    });
    console.log("[MOCK] account found:", !!account);

    if (!account) {
      console.log("[MOCK] Creating account...");
      account = await db.account.create({
        data: {
          userId: dbUserId,
          name: "HDFC Bank (Auto Synced)",
          type: "SAVINGS",
          balance: 0,
          isDefault: true,
        },
      });
    }

    console.log("[MOCK] Generating transactions...");
    const transactions = [];
    let totalBalance = 150000;

    for (let i = 30; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        const type = Math.random() < 0.3 ? "INCOME" : "EXPENSE";
        const cats = CATEGORIES[type];
        const category = cats[Math.floor(Math.random() * cats.length)];
        const amount = getRandomAmount(category.range[0], category.range[1]);

        transactions.push({
          type,
          amount,
          description: type === "INCOME" ? `Credit - ${category.name}` : `UPI / ${category.name}`,
          date,
          category: category.name,
          status: "COMPLETED",
          userId: dbUserId,
          accountId: account.id,
        });

        totalBalance += type === "INCOME" ? amount : -amount;
      }
    }

    console.log("[MOCK] Calling transaction createMany...");
    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId: account.id } });
      await tx.transaction.createMany({ data: transactions });
      await tx.account.update({
        where: { id: account.id },
        data: { balance: totalBalance },
      });
    });

    console.log("[MOCK] Success!");
    return { success: true };
  } catch (error) {
    console.error("Mock Sync Error:", error);
    return { success: false, error: error.message };
  }
}


