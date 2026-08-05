"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateWithFallback } from "@/lib/ollama";
import { getAuthUser } from "@/lib/auth-cache";
import { getFromAICache, setInAICache } from "@/lib/ai-cache";

export async function createGoal(data) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const target = parseFloat(data.targetAmount);
    const current = parseFloat(data.currentAmount || 0);
    const status = current >= target ? "COMPLETED" : "IN_PROGRESS";

    const goal = await db.financialGoal.create({
      data: {
        name: data.name.trim(),
        targetAmount: target,
        currentAmount: current,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status,
        userId: user.id,
      },
    });

    const serializedGoal = {
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    };

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true, data: serializedGoal };
  } catch (error) {
    console.error("Create Goal Error:", error);
    throw new Error(error.message || "Failed to create goal");
  }
}

export async function getGoals() {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const goals = await db.financialGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return goals.map((g) => {
      const targetAmount = Number(g.targetAmount);
      const currentAmount = Number(g.currentAmount);
      const remainingAmount = Math.max(0, targetAmount - currentAmount);
      const progressPercent = Math.min(100, Math.round((currentAmount / targetAmount) * 100));

      let daysRemaining = null;
      let monthsRemaining = null;
      let monthlySavingNeeded = null;
      let dailySavingNeeded = null;

      if (g.deadline) {
        const now = new Date();
        const targetDate = new Date(g.deadline);
        const diffTime = targetDate.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
        
        if (remainingAmount > 0) {
          dailySavingNeeded = daysRemaining > 0 ? Math.round(remainingAmount / daysRemaining) : remainingAmount;
          monthlySavingNeeded = Math.round(remainingAmount / monthsRemaining);
        } else {
          dailySavingNeeded = 0;
          monthlySavingNeeded = 0;
        }
      }

      return {
        ...g,
        targetAmount,
        currentAmount,
        remainingAmount,
        progressPercent,
        daysRemaining,
        monthsRemaining,
        monthlySavingNeeded,
        dailySavingNeeded,
        isCompleted: g.status === "COMPLETED" || currentAmount >= targetAmount,
      };
    });
  } catch (error) {
    console.error("Get Goals Error:", error);
    return [];
  }
}

export async function contributeToGoal(id, amount) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      throw new Error("Invalid deposit amount");
    }

    const existingGoal = await db.financialGoal.findUnique({
      where: { id, userId: user.id },
    });

    if (!existingGoal) throw new Error("Goal not found");

    const newCurrent = Number(existingGoal.currentAmount) + depositAmount;
    const target = Number(existingGoal.targetAmount);
    const newStatus = newCurrent >= target ? "COMPLETED" : existingGoal.status;

    const updated = await db.financialGoal.update({
      where: { id, userId: user.id },
      data: {
        currentAmount: newCurrent,
        status: newStatus,
      },
    });

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: {
        ...updated,
        targetAmount: Number(updated.targetAmount),
        currentAmount: Number(updated.currentAmount),
      },
      message: `Deposited ₹${depositAmount.toLocaleString("en-IN")} to "${existingGoal.name}"!`,
    };
  } catch (error) {
    console.error("Contribute Goal Error:", error);
    throw new Error(error.message || "Failed to contribute funds");
  }
}

export async function updateGoal(id, data) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const target = parseFloat(data.targetAmount);
    const current = parseFloat(data.currentAmount || 0);
    const status = current >= target ? "COMPLETED" : "IN_PROGRESS";

    const updated = await db.financialGoal.update({
      where: { id, userId: user.id },
      data: {
        name: data.name.trim(),
        targetAmount: target,
        currentAmount: current,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status,
      },
    });

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: {
        ...updated,
        targetAmount: Number(updated.targetAmount),
        currentAmount: Number(updated.currentAmount),
      },
    };
  } catch (error) {
    console.error("Update Goal Error:", error);
    throw new Error(error.message || "Failed to update goal");
  }
}

export async function deleteGoal(id) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    await db.financialGoal.delete({
      where: { id, userId: user.id },
    });

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    throw new Error(error.message || "Failed to delete goal");
  }
}

export async function getGoalPlan(goalId) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const cacheKey = `goal-plan-${goalId}`;
    const cachedPlan = getFromAICache(cacheKey);
    if (cachedPlan) {
      return cachedPlan;
    }

    const goal = await db.financialGoal.findUnique({
      where: { id: goalId },
      include: {
        user: {
          include: {
            transactions: {
              where: { type: "EXPENSE" },
              take: 30,
              orderBy: { date: "desc" },
            },
          },
        },
      },
    });

    if (!goal) throw new Error("Goal not found");

    const remaining = Number(goal.targetAmount || 0) - Number(goal.currentAmount || 0);

    const safeTx = (goal.user?.transactions || []).map((t) => ({
      category: t.category || "other",
      amount: Number(t.amount || 0).toFixed(2),
      desc: t.description || "No description",
    }));

    const prompt = `
      Create a highly structured, realistic financial roadmap to achieve this goal:
      Goal Name: ${goal.name}
      Target Amount: ₹${Number(goal.targetAmount || 0).toLocaleString("en-IN")}
      Already Saved: ₹${Number(goal.currentAmount || 0).toLocaleString("en-IN")}
      Remaining to Save: ₹${Math.max(0, remaining).toLocaleString("en-IN")}
      Deadline: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "Flexible Time"}
      
      User's Recent Expenses for Context:
      ${safeTx.map((t) => `- ${t.category}: ₹${t.amount} (${t.desc})`).join("\n")}
      
      Provide an actionable plan in exactly 3 sections:
      1. **Monthly & Daily SIP Targets**: Break down how much to save monthly and daily.
      2. **Expense Trimming Opportunities**: Identify 3 specific discretionary areas to divert funds from.
      3. **Accelerated Milestones & Action Steps**: Tactical advice to reach the goal faster.
      
      Use motivating, clean markdown.
      Always format currency using the Indian Rupee symbol (₹).
    `;

    const text = await generateWithFallback(prompt);
    if (!text) {
      throw new Error("AI responded with an empty result");
    }

    setInAICache(cacheKey, text, 30 * 60 * 1000);
    return text;
  } catch (error) {
    console.error("Goal Plan Error:", error);
    throw new Error(error.message || "Failed to generate goal plan");
  }
}
