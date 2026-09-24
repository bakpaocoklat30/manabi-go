import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { QuestionType } from '@prisma/client';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'GURU') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const params = await context.params;
    const moduleId = params.id;

    const { searchParams } = new URL(req.url);
    const quizType = searchParams.get('type') || 'MULTIPLE_CHOICE';

    const module = await prisma.learningModule.findUnique({
      where: { id: moduleId, authorId: session.user.id },
      include: {
        quizzes: {
          where: { quizType },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: { options: true }
            }
          }
        }
      }
    });

    if (!module) return NextResponse.json({ message: 'Modul tidak valid' }, { status: 404 });

    const quiz = module.quizzes[0] || null;
    return NextResponse.json({ quiz }, { status: 200 });

  } catch (error) {
    console.error('Quiz GET Error', error);
    return NextResponse.json({ message: 'Gagal mengambil data kuis' }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'GURU') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const params = await context.params;
    const moduleId = params.id;

    // Pastikan milik guru ini
    const module = await prisma.learningModule.findUnique({
      where: { id: moduleId, authorId: session.user.id }
    });
    if (!module) return NextResponse.json({ message: 'Modul tidak valid' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const quizType = searchParams.get('type') || 'MULTIPLE_CHOICE';

    const body = await req.json();
    const { title, timeLimitMinutes, passingScore, randomizeOptions, randomizeQuestions, antiCheatMode, allowRetake, maxRetakes, questions } = body;
    console.log('--- SAVE QUIZ PAYLOAD ---');
    console.log('allowRetake:', allowRetake, 'typeof:', typeof allowRetake);
    console.log('-------------------------');

    await prisma.$transaction(async (tx) => {
      // Cek apakah kuis sudah ada
      let quiz = await tx.quiz.findFirst({ where: { moduleId, quizType } });
      
      const quizData = {
        title: title || (quizType === 'ESSAY' ? 'Kuis Isian Singkat' : 'Kuis Evaluasi'),
        quizType,
        timeLimitMinutes: Number(timeLimitMinutes) || 15,
        passingScore: Number(passingScore) || 75,
        randomizeOptions: randomizeOptions !== false,
        randomizeQuestions: randomizeQuestions !== false,
        antiCheatMode: antiCheatMode || 'WARNING',
        allowRetake: typeof allowRetake === 'boolean' ? allowRetake : true,
        maxRetakes: maxRetakes ? Number(maxRetakes) : 3,
        orderIndex: quizType === 'MULTIPLE_CHOICE' ? 1 : 2, // Sort order
      };

      if (quiz) {
        // Update kuis lama
        quiz = await tx.quiz.update({
          where: { id: quiz.id },
          data: quizData
        });
        // Hapus hanya pertanyaan lama, BUKAN kuisnya, agar attempt siswa tetap ada!
        await tx.question.deleteMany({ where: { quizId: quiz.id } });
      } else {
        // Buat kuis baru
        quiz = await tx.quiz.create({
          data: { ...quizData, moduleId }
        });
      }

      // Insert Questions & Options
      if (questions && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const newQ = await tx.question.create({
            data: {
              quizId: quiz.id,
              type: quizType === 'ESSAY' ? QuestionType.ESSAY : QuestionType.MULTIPLE_CHOICE, // Force to match parent quizType so they don't get mixed up!
              referenceAnswer: q.referenceAnswer || null,
              questionText: q.questionText,
              imageUrl: q.imageUrl || null,
              explanation: q.explanation || null,
              orderIndex: i + 1,
            }
          });

          if (q.options && Array.isArray(q.options)) {
            await tx.option.createMany({
              data: q.options.map((opt: any) => ({
                questionId: newQ.id,
                optionText: opt.optionText,
                isCorrect: Boolean(opt.isCorrect)
              }))
            });
          }
        }
      }
    });

    return NextResponse.json({ message: 'Kuis berhasil disimpan!' }, { status: 200 });

  } catch (error) {
    console.error('Quiz POST Error', error);
    return NextResponse.json({ message: 'Gagal menyimpan data kuis' }, { status: 500 });
  }
}
