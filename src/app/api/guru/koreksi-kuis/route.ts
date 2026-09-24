import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== 'GURU' && session.user?.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    // Ambil seluruh attempt kuis siswa yang berstatus PENDING_GRADING atau kuis esai
    const pendingAttempts = await prisma.quizAttempt.findMany({
      where: {
        OR: [
          { status: 'PENDING_GRADING' },
          {
            quiz: {
              OR: [
                { quizType: 'ESSAY' },
                {
                  questions: {
                    some: {
                      type: 'ESSAY',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
            module: {
              select: {
                title: true,
                weekNumber: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            identifier: true,
            kelas: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { completedAt: 'desc' },
        { startedAt: 'desc' },
      ],
    });

    return NextResponse.json({ attempts: pendingAttempts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching koreksi kuis attempts:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
