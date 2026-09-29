import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { QuestionType } from '@prisma/client';
import { cutAudio } from '@/lib/audio-cutter';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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
    const { title, timeLimitMinutes, passingScore, randomizeOptions, randomizeQuestions, antiCheatMode, allowRetake, maxRetakes, showAnswers, showScore, questions } = body;

    const masterAudioUrl = body.audioUrl || null;
    let processedQuestions = [...questions];

    if (quizType === 'LISTENING_AUTO' && masterAudioUrl) {
      const inputPath = path.join(process.cwd(), 'public', masterAudioUrl);
      
      if (fs.existsSync(inputPath)) {
        for (let i = 0; i < processedQuestions.length; i++) {
          const q = processedQuestions[i];
          if (typeof q.audioStartTime === 'number' && typeof q.audioEndTime === 'number') {
            const outputFilename = `cut_${uuidv4()}.mp3`;
            const outputRelativePath = `/uploads/audio/${outputFilename}`;
            const outputPath = path.join(process.cwd(), 'public', 'uploads', 'audio', outputFilename);
            
            try {
              console.log(`[AUTO CUT] Memotong soal ${i+1} dari ${q.audioStartTime} ke ${q.audioEndTime}`);
              await cutAudio(inputPath, outputPath, q.audioStartTime, q.audioEndTime);
              q.audioUrl = outputRelativePath; // Assign hasil potongan untuk siswa
            } catch (err) {
              console.error(`Gagal memotong audio soal ${i+1}:`, err);
            }
          }
        }
      }
    }

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
        showAnswers: typeof showAnswers === 'boolean' ? showAnswers : true,
        showScore: typeof showScore === 'boolean' ? showScore : true,
        audioUrl: body.audioUrl || null,
        orderIndex: quizType === 'MULTIPLE_CHOICE' ? 1 : (quizType === 'ESSAY' ? 2 : (quizType === 'LISTENING' ? 3 : 4)), // Sort order
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
        for (let i = 0; i < processedQuestions.length; i++) {
          const q = processedQuestions[i];
          const newQ = await tx.question.create({
            data: {
              quizId: quiz.id,
              type: ((quizType === 'LISTENING' || quizType === 'LISTENING_AUTO') && q.type === 'ESSAY') ? QuestionType.ESSAY : (quizType === 'ESSAY' ? QuestionType.ESSAY : QuestionType.MULTIPLE_CHOICE),
              referenceAnswer: q.referenceAnswer || null,
              questionText: q.questionText,
              imageUrl: q.imageUrl || null,
              audioUrl: q.audioUrl || null,
              audioStartTime: q.audioStartTime !== undefined ? Number(q.audioStartTime) : null,
              audioEndTime: q.audioEndTime !== undefined ? Number(q.audioEndTime) : null,
              explanation: q.explanation || null,
              orderIndex: i + 1,
            }
          });

          if (q.options && Array.isArray(q.options)) {
            await tx.option.createMany({
              data: q.options.map((opt: any) => ({
                questionId: newQ.id,
                optionText: opt.optionText,
                imageUrl: opt.imageUrl || null,
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
