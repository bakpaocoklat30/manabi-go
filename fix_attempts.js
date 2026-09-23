const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.quizAttempt.deleteMany({
    where: {
      id: { in: ['06ad8421-54a2-427f-981b-de110be15360', 'fd614994-261a-4090-b321-64be06e24fc2'] }
    }
  });
  console.log('Deleted glitchy attempts.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
