import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'GURU') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const pendingAttempts = await prisma.quizAttempt.findMany({
      where: {
        status: 'PENDING_GRADING',
        quiz: {
          module: {
            authorId: session.user.id,
          },
        },
      },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        student: { select: { name: true, identifier: true } },
      },
      orderBy: { startedAt: 'asc' },
    });

    return NextResponse.json({ attempts: pendingAttempts }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
