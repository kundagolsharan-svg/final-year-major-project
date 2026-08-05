import { db } from "@/lib/prisma";
import { categorizeTransaction } from "@/actions/transaction"; // We will reuse local AI

// Simulated Account Aggregator Providers
export const AA_PROVIDERS = [
  { id: "MOCK_SETU", name: "Setu AA (Mock)" },
  { id: "MOCK_FINVU", name: "Finvu AA (Mock)" },
];

/**
 * MOCK: Initiates a consent request to the Account Aggregator
 * In a real implementation, this hits the AA's /Consent API.
 */
export async function initiateBankConsent(userId, providerId, bankName) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const consentId = `mock-consent-${Math.random().toString(36).substring(2, 10)}`;
  
  const connection = await db.bankConnection.create({
    data: {
      userId,
      provider: providerId,
      bankName: bankName,
      status: "PENDING", // PENDING -> ACTIVE when user approves on the AA portal
      consentId: consentId,
    }
  });

  // Return a mock redirect URL that the frontend would redirect to for user approval
  return {
    success: true,
    connectionId: connection.id,
    consentId: consentId,
    redirectUrl: `/mock-aa-portal?consentId=${consentId}&callback=/dashboard`,
  };
}

/**
 * MOCK: Simulates the webhook callback when a user approves the consent on the AA portal.
 */
export async function activateConsent(consentId) {
  await db.bankConnection.update({
    where: { consentId },
    data: { status: "ACTIVE" },
  });

  return { success: true };
}

/**
 * MOCK: Fetches FI (Financial Information) data from the FIP (Bank) via the AA.
 * In a real implementation, this requests data decryption via the AA's /FI/fetch API.
 */
export async function fetchAndSyncFiData(connectionId, accountId, userId) {
  const connection = await db.bankConnection.findUnique({ where: { id: connectionId } });
  if (!connection || connection.status !== "ACTIVE") {
    throw new Error("Invalid or inactive bank connection");
  }

  // Create a sync job record
  const job = await db.fiDataJob.create({
    data: {
      connectionId,
      status: "IN_PROGRESS",
    }
  });

  try {
    // Generate some mock real-world looking transactions
    const mockData = generateMockTransactions(5);
    let syncCount = 0;

    for (const data of mockData) {
      // 1. Check if hash exists to prevent duplicates (Phase 2 feature)
      const hash = `${userId}-${data.date.toISOString()}-${data.amount}-${data.description}`;
      const existing = await db.transaction.findUnique({ where: { hash } });
      
      if (!existing) {
        // 2. Categorize using our local AI (Phase 1/3)
        const catInfo = await categorizeTransaction(data.description);
        
        await db.transaction.create({
          data: {
            userId,
            accountId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            date: data.date,
            category: catInfo.category,
            taxCategory: catInfo.taxCategory,
            hash,
          }
        });
        syncCount++;
        
        // Update account balance
        const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
        await db.account.update({
          where: { id: accountId },
          data: { balance: { increment: balanceChange } }
        });
      }
    }

    // Mark job complete
    await db.fiDataJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", transactionsSync: syncCount }
    });

    return { success: true, synced: syncCount };
  } catch (error) {
    console.error("FI Sync Error:", error);
    await db.fiDataJob.update({
      where: { id: job.id },
      data: { status: "FAILED" }
    });
    return { success: false, error: error.message };
  }
}

function generateMockTransactions(count) {
  const templates = [
    { desc: "UBER RIDES", amount: () => Math.floor(Math.random() * 500 + 100), type: "EXPENSE" },
    { desc: "SWIGGY INSTAMART", amount: () => Math.floor(Math.random() * 800 + 200), type: "EXPENSE" },
    { desc: "AMAZON RETAIL", amount: () => Math.floor(Math.random() * 3000 + 500), type: "EXPENSE" },
    { desc: "SALARY CREDITED", amount: () => Math.floor(Math.random() * 50000 + 80000), type: "INCOME" },
    { desc: "NETFLIX SUB", amount: () => 199, type: "EXPENSE" },
    { desc: "STARBUCKS COFFEE", amount: () => Math.floor(Math.random() * 300 + 200), type: "EXPENSE" },
  ];

  const results = [];
  for (let i = 0; i < count; i++) {
    const t = templates[Math.floor(Math.random() * templates.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 10)); // random date in last 10 days
    results.push({
      description: t.desc,
      amount: t.amount(),
      type: t.type,
      date: date
    });
  }
  return results;
}
