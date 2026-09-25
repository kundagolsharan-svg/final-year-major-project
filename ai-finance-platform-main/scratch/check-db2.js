const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txns = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Total transactions in DB: ${txns.length}`);
  
  let nullHashes = 0;
  for (const t of txns) {
    if (t.hash === null) nullHashes++;
  }
  console.log(`Transactions with null hash: ${nullHashes}`);

  const counts = {};
  txns.forEach(t => {
    const key = `${t.date}-${t.amount}-${t.description}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  let duplicates = 0;
  for (const [key, count] of Object.entries(counts)) {
    if (count > 1) {
      console.log(`DUPLICATE FOUND IN DB: ${key} (Count: ${count})`);
      duplicates++;
    }
  }
  console.log(`Total unique duplicate groups: ${duplicates}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
