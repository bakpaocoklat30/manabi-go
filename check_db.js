const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const submissions = await prisma.taskSubmission.findMany({
    take: 5,
    orderBy: { submittedAt: 'desc' },
    include: { student: true }
  });
  console.log(JSON.stringify(submissions, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
