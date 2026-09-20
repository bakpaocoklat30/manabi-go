import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    if (!userId || (userRole !== 'GURU' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { message: 'Akses tidak diizinkan.' },
        { status: 403 }
      );
    }

    const submissions = await prisma.taskSubmission.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            identifier: true,
            kelas: {
              select: {
                name: true,
              },
            },
          },
        },
        moduleItem: {
          select: {
            title: true,
            module: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(submissions, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error API List Evaluations:', error);
    return NextResponse.json(
      { message: 'Gagal mengambil daftar tugas dari database.' },
      { status: 500 }
    );
  }
}