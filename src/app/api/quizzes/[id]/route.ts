import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Akses ditolak. Sesi tidak ditemukan.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            type: true,
            questionText: true,
            imageUrl: true,
            audioUrl: true,
            orderIndex: true,
            options: {
              select: {
                id: true,
                optionText: true,
                imageUrl: true,
                // Kunci isCorrect disembunyikan agar anti-cheat di console browser
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { message: 'Modul kuis tidak ditemukan.' },
        { status: 404 }
      );
    }

    const attemptsCount = await prisma.quizAttempt.count({
      where: { quizId: id, studentId: session.user.id }
    });
    
    // Check if they exceeded retakes
    if (attemptsCount > 0 && quiz.allowRetake === false) {
      return NextResponse.json({ message: 'Anda sudah mengerjakan kuis ini dan pengulangan tidak diizinkan.' }, { status: 403 });
    }
    
    if (quiz.allowRetake && attemptsCount >= quiz.maxRetakes) {
      return NextResponse.json({ message: `Batas maksimal pengulangan (${quiz.maxRetakes} kali) telah habis.` }, { status: 403 });
    }

    return NextResponse.json({ ...quiz, attemptsCount }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error API Get Quiz Details:', error);
    return NextResponse.json(
      { message: 'Gagal memuat detail kuis dari database.' },
      { status: 500 }
    );
  }
}