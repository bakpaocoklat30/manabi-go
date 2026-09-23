const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const qs = await prisma.question.findMany({
    where: { quiz: { moduleId: '7f58b366-100d-448d-a694-fd54569edb9d' } },
    include: { quiz: true }
  });
  console.log(JSON.stringify(qs.map(q => ({ qId: q.id, type: q.type, qText: q.questionText, quizType: q.quiz.quizType })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
