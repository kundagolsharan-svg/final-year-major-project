const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txns = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log(`Found ${txns.length} transactions`);
  for (const t of txns) {
    console.log(`Desc: ${t.description}`);
    console.log(`Amt: ${t.amount}, Date: ${t.date}, Type: ${t.type}, Ref: ${t.referenceId}`);
    console.log(`Hash in DB: ${t.hash}`);
    console.log('----------------');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
