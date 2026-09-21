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

    for (const question of quiz.questions) {
      const studentAnswer = answers.find((a) => a.questionId === question.id);
      let isAnswerCorrect = false;
      let chosenOptionId = null;
      let correctOptionId = null;

      if (question.type === 'ESSAY') {
        // AI Grading for Essay
        const studentText = studentAnswer?.answerText || '';
        const reference = question.referenceAnswer || '';
        
        if (studentText.trim().length > 0) {
          try {
            const aiSetting = await prisma.systemSetting.findUnique({ where: { key: 'ai_grading_prompt' } });
            const defaultPrompt = `Anda adalah guru bahasa yang mengoreksi jawaban singkat.\nPertanyaan/Konteks tidak diberikan, tapi ini Kunci Jawaban Benar: "{{reference}}"\nJawaban Siswa: "{{studentText}}"\nTugas Anda: Jika jawaban siswa memiliki makna yang sama, secara semantik benar, atau merujuk pada hal yang persis sama dengan kunci jawaban (abaikan salah ketik kecil/typo), balas HANYA dengan kata "TRUE". Jika salah, balas HANYA dengan kata "FALSE".`;
            let prompt = (aiSetting?.value || defaultPrompt)
              .replace('{{reference}}', reference)
              .replace('{{studentText}}', studentText);
            
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
              const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { maxOutputTokens: 5, temperature: 0.1 }
                })
              });
              const aiData = await res.json();
              const aiResponseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toUpperCase() || '';
              if (aiResponseText.includes('TRUE')) {
                isAnswerCorrect = true;
              }
            } else {
              // Fallback manual check if no API key
              if (studentText.toLowerCase().trim() === reference.toLowerCase().trim()) {
                isAnswerCorrect = true;
              }
            }
          } catch (e) {
            console.error('AI Grading failed', e);
          }
        }
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