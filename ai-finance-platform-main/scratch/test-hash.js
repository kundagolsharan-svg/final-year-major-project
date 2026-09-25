const crypto = require("crypto");

function computeTransactionHash(userId, date, amount, description, type) {
  const dateStr = new Date(date).toISOString().split("T")[0];
  const amtStr = Number(amount).toFixed(2);
  const typeStr = type || "EXPENSE";
  
  const words = String(description || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/);
  const firstWord = words.length > 0 && words[0] ? words[0].substring(0, 8) : "txn";

  const raw = `${userId}|${dateStr}|${amtStr}|${typeStr}|${firstWord}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

console.log(computeTransactionHash("user123", "2024-03-15", 150, "Swiggy Bangalore", "EXPENSE"));
console.log(computeTransactionHash("user123", "2024-03-15", 150.00, "Swiggy App Order", "EXPENSE"));
console.log(computeTransactionHash("user123", "2024-03-15T00:00:00.000Z", 150, "Swiggy", "EXPENSE"));
