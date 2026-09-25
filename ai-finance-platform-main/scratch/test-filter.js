const crypto = require("crypto");

function computeTransactionHash(userId, date, amount, description, type, referenceId) {
  const cleanRef = referenceId ? String(referenceId).trim().replace(/[^a-zA-Z0-9]/g, "") : "";
  if (cleanRef.length >= 6 && !["null", "none", "undefined"].includes(cleanRef.toLowerCase())) {
    const rawRef = `${userId}|${cleanRef}`;
    return crypto.createHash("sha256").update(rawRef).digest("hex");
  }

  const dateStr = new Date(date).toISOString().split("T")[0];
  const amtStr = Number(amount).toFixed(2);
  const typeStr = type || "EXPENSE";
  const words = String(description || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/);
  const firstWord = words.length > 0 && words[0] ? words[0].substring(0, 8) : "txn";

  const raw = `${userId}|${dateStr}|${amtStr}|${typeStr}|${firstWord}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

let incomingHashes = new Set();
let newTransactionsToInsert = [];

let transactions = [
  { amount: 150, date: "2024-03-15", description: "Swiggy Bangalore", type: "EXPENSE", id: 1 },
  { amount: 150, date: "2024-03-15", description: "Swiggy App", type: "EXPENSE", id: 2 } // Same day, same amt, same word!
];

for (let t of transactions) {
  let baseHash = computeTransactionHash("user123", t.date, t.amount, t.description, t.type, null);
  let finalHash = baseHash;
  let counter = 1;
  while (incomingHashes.has(finalHash)) {
    finalHash = `${baseHash}-${counter}`;
    counter++;
  }
  incomingHashes.add(finalHash);
  newTransactionsToInsert.push({ ...t, hash: finalHash });
}

console.log("Incoming Hashes Generated:", Array.from(incomingHashes));

// Simulate existing in DB
let existingHashes = new Set(Array.from(incomingHashes)); // Pretend both are in DB

let unique = newTransactionsToInsert.filter(t => !existingHashes.has(t.hash));
console.log("Unique to insert on second upload:", unique.length); // Should be 0!
