const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const quizzes = await prisma.quiz.findMany({
    where: { moduleId: '7f58b366-100d-448d-a694-fd54569edb9d' },
    include: { attempts: true }
  });
  console.log(JSON.stringify(quizzes, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
