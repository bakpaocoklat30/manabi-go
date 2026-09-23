const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const quizzes = await prisma.quiz.findMany();
  for (const qz of quizzes) {
    await prisma.question.updateMany({
      where: { quizId: qz.id },
      data: { type: qz.quizType }
    });
    // Set orderIndex on the quiz itself just in case
    await prisma.quiz.update({
      where: { id: qz.id },
      data: { orderIndex: qz.quizType === 'MULTIPLE_CHOICE' ? 1 : 2 }
    });
  }
  console.log('Fixed question types and quiz orders in DB.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
