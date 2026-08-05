"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Simulated FIP (Financial Information Provider) Accounts Registry for India
// Matches real bank structures linked to mobile numbers
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_BANK_REGISTRY = [
  {
    bankId: "HDFC",
    bankName: "HDFC Bank",
    accountNumber: "XXXX4829",
    accountType: "SAVINGS",
    initialBalance: 145230.50,
    logo: "https://assets.setu.co/bank-logos/hdfc.png",
    sampleTransactions: [
      { desc: "Swiggy Bangalore", amount: 480, type: "EXPENSE", category: "food" },
      { desc: "Cold Drinks & Soda Cafe", amount: 150, type: "EXPENSE", category: "food" },
      { desc: "Amazon India Order", amount: 2499, type: "EXPENSE", category: "shopping" },
      { desc: "HPCL Petrol Pump Fuel", amount: 1500, type: "EXPENSE", category: "transportation" },
      { desc: "Salary Credit - TechCorp", amount: 85000, type: "INCOME", category: "salary" },
      { desc: "Netflix Subscription", amount: 649, type: "EXPENSE", category: "entertainment" },
      { desc: "Blinkit Grocery Mart", amount: 720, type: "EXPENSE", category: "groceries" },
      { desc: "Zomato Gourmet Dining", amount: 1120, type: "EXPENSE", category: "food" },
    ],
  },
  {
    bankId: "SBI",
    bankName: "State Bank of India (SBI)",
    accountNumber: "XXXX9102",
    accountType: "SAVINGS",
    initialBalance: 84500.00,
    logo: "https://assets.setu.co/bank-logos/sbi.png",
    sampleTransactions: [
      { desc: "BESCOM Electricity Bill", amount: 1850, type: "EXPENSE", category: "utilities" },
      { desc: "Apollo Pharmacy Medicines", amount: 620, type: "EXPENSE", category: "healthcare" },
      { desc: "Airtel Fiber Broadband", amount: 1179, type: "EXPENSE", category: "utilities" },
      { desc: "DMart Supermarket Grocery", amount: 3450, type: "EXPENSE", category: "groceries" },
      { desc: "UPI Credit - Interest Refund", amount: 1250, type: "INCOME", category: "income" },
      { desc: "Starbucks Coffee & Beverages", amount: 490, type: "EXPENSE", category: "food" },
    ],
  },
  {
    bankId: "ICICI",
    bankName: "ICICI Bank",
    accountNumber: "XXXX3381",
    accountType: "CURRENT",
    initialBalance: 210000.00,
    logo: "https://assets.setu.co/bank-logos/icici.png",
    sampleTransactions: [
      { desc: "Flipkart Electronics Purchase", amount: 12990, type: "EXPENSE", category: "shopping" },
      { desc: "Uber Trip Commute", amount: 340, type: "EXPENSE", category: "transportation" },
      { desc: "Chaayos Chai & Snacks", amount: 210, type: "EXPENSE", category: "food" },
      { desc: "Zerodha Fund Transfer", amount: 10000, type: "EXPENSE", category: "insurance" },
      { desc: "Freelance Payment Credit", amount: 45000, type: "INCOME", category: "income" },
    ],
  },
  {
    bankId: "AXIS",
    bankName: "Axis Bank",
    accountNumber: "XXXX1044",
    accountType: "SAVINGS",
    initialBalance: 32100.00,
    logo: "https://assets.setu.co/bank-logos/axis.png",
    sampleTransactions: [
      { desc: "Myntra Apparel Fashion", amount: 1890, type: "EXPENSE", category: "shopping" },
      { desc: "BookMyShow Movie Tickets", amount: 750, type: "EXPENSE", category: "entertainment" },
      { desc: "Zepto 10-min Grocery", amount: 410, type: "EXPENSE", category: "groceries" },
    ],
  },
  {
    bankId: "KOTAK",
    bankName: "Kotak Mahindra Bank",
    accountNumber: "XXXX5512",
    accountType: "SAVINGS",
    initialBalance: 18400.00,
    logo: "https://assets.setu.co/bank-logos/kotak.png",
    sampleTransactions: [
      { desc: "Cold Drinks & Juice Corner", amount: 95, type: "EXPENSE", category: "food" },
      { desc: "Fastag Toll Recharge", amount: 500, type: "EXPENSE", category: "transportation" },
      { desc: "UPI Cashback Received", amount: 150, type: "INCOME", category: "income" },
    ],
  },
];

// Helper: Normalize description for deduplication hash
function computeHash(userId, date, amount, description) {
  const dateStr = new Date(date).toISOString().split("T")[0];
  const amtStr = Number(amount).toFixed(2);
  const normDesc = String(description).toLowerCase().trim().substring(0, 50);
  return crypto
    .createHash("sha256")
    .update(`${userId}|${dateStr}|${amtStr}|${normDesc}`)
    .digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Send OTP to Bank-Registered Mobile Number
// ─────────────────────────────────────────────────────────────────────────────
export async function sendAAOtp(mobileNumber) {
  try {
    if (!mobileNumber || mobileNumber.length < 10) {
      throw new Error("Please enter a valid 10-digit Indian mobile number.");
    }

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, "");
    if (cleanMobile.length !== 10) {
      throw new Error("Mobile number must be exactly 10 digits.");
    }

    // Generate a 6-digit OTP
    const otp = "123456"; // Default standard test OTP for instant testing

    return {
      success: true,
      message: `OTP sent to +91 ${cleanMobile.substring(0, 2)}*****${cleanMobile.substring(7)} via Account Aggregator Gateway. (Use OTP: 123456)`,
      mobileNumber: cleanMobile,
      otpHint: "123456",
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Verify OTP & Discover Bank Accounts Linked to Mobile Number
// ─────────────────────────────────────────────────────────────────────────────
export async function discoverBankAccountsByMobile(mobileNumber, otp) {
  try {
    if (otp !== "123456" && otp.length !== 6) {
      throw new Error("Invalid OTP. Please enter 123456 to verify.");
    }

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Discover banks linked to mobile number (simulating RBI AA FIP discovery)
    // We return a set of 3 to 4 discovered accounts based on phone digit variation
    const lastDigit = Number(mobileNumber.slice(-1)) || 0;
    const discoveredBanks = MOCK_BANK_REGISTRY.slice(0, 3 + (lastDigit % 3));

    return {
      success: true,
      mobileNumber,
      discoveredAccounts: discoveredBanks.map((b) => ({
        bankId: b.bankId,
        bankName: b.bankName,
        accountNumber: b.accountNumber,
        accountType: b.accountType,
        balance: b.initialBalance,
        logo: b.logo,
        txnPreviewCount: b.sampleTransactions.length,
      })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Approve Consent & Automatically Link Accounts & Sync Transactions
// ─────────────────────────────────────────────────────────────────────────────
export async function approveConsentAndSyncAccounts(selectedBankIds, mobileNumber) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    if (!selectedBankIds || selectedBankIds.length === 0) {
      throw new Error("Please select at least one bank account to link.");
    }

    const banksToSync = MOCK_BANK_REGISTRY.filter((b) =>
      selectedBankIds.includes(b.bankId)
    );

    let totalAccountsCreatedOrUpdated = 0;
    let totalTransactionsSynced = 0;
    let totalDuplicatesSkipped = 0;
    let grandTotalBalance = 0;

    for (const bank of banksToSync) {
      // 1. Create or find existing account in database
      const accountName = `${bank.bankName} (${bank.accountNumber})`;

      let account = await db.account.findFirst({
        where: { userId: user.id, name: accountName },
      });

      if (!account) {
        account = await db.account.create({
          data: {
            userId: user.id,
            name: accountName,
            type: bank.accountType === "CURRENT" ? "CURRENT" : "SAVINGS",
            balance: bank.initialBalance,
            isDefault: totalAccountsCreatedOrUpdated === 0,
          },
        });
      } else {
        // Update balance
        account = await db.account.update({
          where: { id: account.id },
          data: { balance: bank.initialBalance },
        });
      }

      totalAccountsCreatedOrUpdated++;
      grandTotalBalance += bank.initialBalance;

      // 2. Fetch and import sample transactions for this bank
      let bankBalanceDelta = 0;

      for (let i = 0; i < bank.sampleTransactions.length; i++) {
        const sample = bank.sampleTransactions[i];
        const date = new Date();
        date.setDate(date.getDate() - (i * 2 + 1)); // Distributed dates in past 2 weeks

        const hash = computeHash(user.id, date, sample.amount, sample.desc);

        const existingTxn = await db.transaction.findFirst({
          where: { userId: user.id, hash },
        });

        if (existingTxn) {
          totalDuplicatesSkipped++;
          continue;
        }

        await db.transaction.create({
          data: {
            type: sample.type,
            amount: sample.amount,
            description: sample.desc,
            date,
            category: sample.category,
            userId: user.id,
            accountId: account.id,
            hash,
          },
        });

        totalTransactionsSynced++;
        bankBalanceDelta += sample.type === "EXPENSE" ? -sample.amount : sample.amount;
      }
    }

    // Revalidate dashboard and account pages
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidatePath("/analyzer");

    return {
      success: true,
      linkedAccountsCount: totalAccountsCreatedOrUpdated,
      syncedTransactionsCount: totalTransactionsSynced,
      duplicatesSkippedCount: totalDuplicatesSkipped,
      message: `Successfully linked ${totalAccountsCreatedOrUpdated} bank account(s) via Account Aggregator and auto-synced ${totalTransactionsSynced} transaction(s)!`,
    };
  } catch (error) {
    console.error("AA Sync Error:", error);
    return { success: false, error: error.message };
  }
}
