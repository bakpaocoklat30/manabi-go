const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.quizAttempt.deleteMany({
    where: {
      id: { in: ['6975fb36-8b96-48fa-b1be-0bc28cadb296'] }
    }
  });
  console.log('Deleted test attempt.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
