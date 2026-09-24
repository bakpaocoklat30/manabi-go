import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SubmittedAnswer {
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
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

    const attemptsCount = await prisma.quizAttempt.count({
      where: { quizId: quizId, studentId: userId }
    });
    
    if (attemptsCount > 0 && quiz.allowRetake === false) {
      return NextResponse.json({ message: 'Anda sudah mengerjakan kuis ini dan pengulangan tidak diizinkan.' }, { status: 403 });
    }
    
    if (quiz.allowRetake && attemptsCount >= quiz.maxRetakes) {
      return NextResponse.json({ message: `Batas maksimal pengulangan (${quiz.maxRetakes} kali) telah habis.` }, { status: 403 });
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
    const reviewDetails = [];
    const isPending = quiz.quizType === 'ESSAY';

    for (const question of quiz.questions) {
      const studentAnswer = answers.find((a) => a.questionId === question.id);
      let isAnswerCorrect = false;
      let chosenOptionId = null;
      let correctOptionId = null;

      if (question.type === 'ESSAY') {
        // Tipe essay tidak lagi dinilai instan secara otomatis oleh AI
        // Status kuis akan menjadi PENDING_GRADING
        isAnswerCorrect = false;
      } else {
        // Normal Multiple Choice
        chosenOptionId = studentAnswer?.selectedOptionId || null;
        const correctOption = question.options.find((opt) => opt.isCorrect);
        correctOptionId = correctOption?.id || null;
        
        isAnswerCorrect = Boolean(
          chosenOptionId && correctOption && chosenOptionId === correctOption.id
        );
      }

      if (isAnswerCorrect) {
        totalCorrect += 1;
      }

      reviewDetails.push({
        questionId: question.id,
        questionText: question.questionText,
        imageUrl: question.imageUrl,
        explanation: question.explanation,
        selectedOptionId: chosenOptionId,
        studentAnswerText: studentAnswer?.answerText, // For essay
        correctOptionId,
        isCorrect: isAnswerCorrect,
      });
    }

    const finalScore = isPending ? 0 : Math.round((totalCorrect / totalQuestions) * 100);
    const status = isPending ? 'PENDING_GRADING' : 'GRADED';
    
    const answersJson = answers.map(a => ({
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId || null,
      answerText: a.answerText || ''
    }));

    // Simpan riwayat attempt siswa ke PostgreSQL
    const attemptRecord = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: userId,
        score: finalScore,
        totalCorrect: isPending ? 0 : totalCorrect,
        totalQuestions,
        cheatCount: cheatCount || 0,
        completedAt: new Date(),
        status,
        answers: answersJson
      },
    });

    return NextResponse.json(
      {
        message: isPending ? 'Jawaban berhasil dikumpulkan. Menunggu koreksi dari guru.' : 'Kuis berhasil dinilai.',
        attemptId: attemptRecord.id,
        score: finalScore,
        status,
        totalCorrect: isPending ? 0 : totalCorrect,
        totalQuestions,
        isPassed: isPending ? false : finalScore >= quiz.passingScore,
        passingScore: quiz.passingScore,
        review: isPending ? [] : reviewDetails, // Hide review details if pending
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error API Submit Kuis:', error);
    return NextResponse.json(
      { 
        message: error?.message 
          ? `Gagal memproses evaluasi kuis: ${error.message}` 
          : 'Terjadi kegagalan pemrosesan evaluasi kuis pada server.',
        errorDetail: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
