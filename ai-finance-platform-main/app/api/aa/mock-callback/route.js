import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { subDays } from "date-fns";

const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [50000, 80000] },
    { name: "freelance", range: [10000, 30000] },
    { name: "investments", range: [5000, 20000] },
  ],
  EXPENSE: [
    { name: "housing", range: [10000, 25000] },
    { name: "transportation", range: [2000, 5000] },
    { name: "groceries", range: [4000, 10000] },
    { name: "utilities", range: [1500, 4000] },
    { name: "food", range: [2000, 8000] },
    { name: "shopping", range: [3000, 15000] },
  ],
};

function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/sign-in", request.url));

    // Create a mock bank account
    let account = await db.account.findFirst({
      where: { userId, name: "HDFC Bank (Auto Synced)" },
    });

    if (!account) {
      account = await db.account.create({
        data: {
          userId,
          name: "HDFC Bank (Auto Synced)",
          type: "SAVINGS",
          balance: 0, // Will update after seed
          isDefault: true,
        },
      });
    }

    // Generate 30 days of transactions
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
          userId,
          accountId: account.id,
        });

        totalBalance += type === "INCOME" ? amount : -amount;
      }
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId: account.id } });
      await tx.transaction.createMany({ data: transactions });
      await tx.account.update({
        where: { id: account.id },
        data: { balance: totalBalance },
      });
    });

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error("Mock Sync Error:", error);
    const errorUrl = request.nextUrl.clone();
    errorUrl.pathname = "/dashboard";
    errorUrl.searchParams.set("error", "sync_failed");
    return NextResponse.redirect(errorUrl);
  }
}
