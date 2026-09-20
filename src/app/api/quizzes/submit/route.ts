import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SubmittedAnswer {
  questionId: string;
  selectedOptionId: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId || session?.user?.role !== 'SISWA') {
      return NextResponse.json(
        { message: 'Akses tidak sah. Silakan login sebagai siswa.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { quizId, answers, cheatCount }: { quizId: string; answers: SubmittedAnswer[]; cheatCount?: number } = body;

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json(
        { message: 'Format data pengumpulan kuis tidak valid.' },
        { status: 400 }
      );
    }

    // Ambil data kuis beserta kunci jawaban asli dari basis data
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { message: 'Kuis tidak ditemukan.' },
        { status: 404 }
      );
    }

    const totalQuestions = quiz.questions.length;
    if (totalQuestions === 0) {
      return NextResponse.json(
        { message: 'Kuis ini belum memiliki daftar pertanyaan.' },
        { status: 400 }
      );
    }

    // Pemetaan jawaban dan penghitungan skor
    let totalCorrect = 0;
    const reviewDetails = quiz.questions.map((question) => {
      const studentAnswer = answers.find((a) => a.questionId === question.id);
      const chosenOptionId = studentAnswer?.selectedOptionId || null;
      const correctOption = question.options.find((opt) => opt.isCorrect);

      const isAnswerCorrect = Boolean(
        chosenOptionId && correctOption && chosenOptionId === correctOption.id
      );

      if (isAnswerCorrect) {
        totalCorrect += 1;
      }

      return {
        questionId: question.id,
        questionText: question.questionText,
        imageUrl: question.imageUrl,
        explanation: question.explanation,
        selectedOptionId: chosenOptionId,
        correctOptionId: correctOption?.id || null,
        isCorrect: isAnswerCorrect,
      };
    });

    const finalScore = Math.round((totalCorrect / totalQuestions) * 100);

    // Simpan riwayat attempt siswa ke PostgreSQL
    const attemptRecord = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: userId,
        score: finalScore,
        totalCorrect,
        totalQuestions,
        cheatCount: cheatCount || 0,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'Kuis berhasil dinilai.',
        attemptId: attemptRecord.id,
        score: finalScore,
        totalCorrect,
        totalQuestions,
        isPassed: finalScore >= quiz.passingScore,
        passingScore: quiz.passingScore,
        review: reviewDetails,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error API Submit Kuis:', error);
    return NextResponse.json(
      { message: 'Terjadi kegagalan pemrosesan evaluasi kuis pada server.' },
      { status: 500 }
    );
  }
}