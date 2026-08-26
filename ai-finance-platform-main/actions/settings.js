"use server";

import { db } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { invalidateAICache } from "@/lib/ai-cache";
import { revalidatePath } from "next/cache";

export async function getUserSettings() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        accounts: {
          select: { id: true, name: true, type: true, isDefault: true, balance: true },
        },
        budgets: true,
        _count: {
          select: { transactions: true, goals: true, accounts: true },
        },
        systemLogs: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

    if (!fullUser) throw new Error("User not found");

    return {
      success: true,
      data: {
        id: fullUser.id,
        name: fullUser.name || "SAMPAT User",
        email: fullUser.email,
        imageUrl: fullUser.imageUrl,
        createdAt: fullUser.createdAt,
        accountCount: fullUser._count.accounts,
        transactionCount: fullUser._count.transactions,
        goalCount: fullUser._count.goals,
        budget: fullUser.budgets ? Number(fullUser.budgets.amount) : 0,
        accounts: fullUser.accounts.map((a) => ({
          ...a,
          balance: Number(a.balance),
        })),
        systemLogs: fullUser.systemLogs || [],
        budgetAlerts: fullUser.budgetAlerts,
        fraudAlerts: fullUser.fraudAlerts,
        billReminders: fullUser.billReminders,
        weeklyDigest: fullUser.weeklyDigest,
      },
    };
  } catch (error) {
    console.error("Get User Settings Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(data) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    await db.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return { success: false, error: error.message };
  }
}

export async function exportAllUserData() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const fullData = await db.user.findUnique({
      where: { id: user.id },
      include: {
        accounts: true,
        transactions: {
          orderBy: { date: "desc" },
        },
        budgets: true,
        goals: true,
      },
    });

    if (!fullData) throw new Error("User not found");

    const exportPayload = {
      user: {
        name: fullData.name,
        email: fullData.email,
        exportedAt: new Date().toISOString(),
      },
      accounts: fullData.accounts.map((a) => ({
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
        isDefault: a.isDefault,
      })),
      transactions: fullData.transactions.map((t) => ({
        date: t.date,
        type: t.type,
        amount: Number(t.amount),
        category: t.category,
        description: t.description,
        isRecurring: t.isRecurring,
        taxCategory: t.taxCategory,
      })),
      budget: fullData.budgets ? { amount: Number(fullData.budgets.amount) } : null,
      goals: fullData.goals.map((g) => ({
        name: g.name,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        deadline: g.deadline,
      })),
    };

    return { success: true, data: exportPayload };
  } catch (error) {
    console.error("Export Data Error:", error);
    return { success: false, error: error.message };
  }
}

export async function clearAICacheAction() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    invalidateAICache();
    return { success: true, message: "AI cache cleared successfully. Fresh insights will be generated." };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteAllUserTransactions() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    await db.transaction.deleteMany({
      where: { userId: user.id },
    });

    // Reset account balances to 0
    await db.account.updateMany({
      where: { userId: user.id },
      data: { balance: 0 },
    });

    invalidateAICache();
    revalidatePath("/dashboard");
    revalidatePath("/transaction");
    revalidatePath("/budget");
    revalidatePath("/analyzer");
    revalidatePath("/settings");

    return { success: true, message: "All transactions cleared successfully." };
  } catch (error) {
    console.error("Delete Transactions Error:", error);
    return { success: false, error: error.message };
  }
}

export async function logUserSessionAction(actionType) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (actionType !== "LOGIN" && actionType !== "LOGOUT") {
      return { success: false, error: "Invalid action type" };
    }

    await db.systemLog.create({
      data: {
        userId: user.id,
        action: actionType,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Log User Session Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateNotificationPreferences(data) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    await db.user.update({
      where: { id: user.id },
      data: {
        budgetAlerts: data.budgetAlerts,
        fraudAlerts: data.fraudAlerts,
        billReminders: data.billReminders,
        weeklyDigest: data.weeklyDigest,
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "Notification preferences saved" };
  } catch (error) {
    console.error("Update Preferences Error:", error);
    return { success: false, error: error.message };
  }
}
