const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txns = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const counts = {};
  txns.forEach(t => {
    const key = `${t.date}-${t.amount}`; // Just use Date + Amt to find a group
    if (!counts[key]) counts[key] = [];
    counts[key].push(t);
  });

  for (const [key, group] of Object.entries(counts)) {
    if (group.length === 2 && group[0].description !== group[1].description) {
      console.log(`\nDUPLICATE GROUP WITH DIFFERENT DESCRIPTIONS: ${key}`);
      console.log(`TX 1: Desc: ${group[0].description} | Hash: ${group[0].hash}`);
      console.log(`TX 2: Desc: ${group[1].description} | Hash: ${group[1].hash}`);
      break;
    }
  }

  for (const [key, group] of Object.entries(counts)) {
    if (group.length === 2 && group[0].description === group[1].description) {
      console.log(`\nDUPLICATE GROUP WITH SAME DESCRIPTIONS: ${key}`);
      console.log(`TX 1: Desc: ${group[0].description} | Hash: ${group[0].hash}`);
      console.log(`TX 2: Desc: ${group[1].description} | Hash: ${group[1].hash}`);
      break;
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
