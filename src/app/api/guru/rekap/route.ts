import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'GURU') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const modules = await prisma.learningModule.findMany({
      where: { authorId: session.user.id },
      include: {
        items: {
          where: { type: 'TUGAS_MENULIS' },
          orderBy: { orderIndex: 'asc' }
        },
        quizzes: true,
      },
      orderBy: { weekNumber: 'asc' }
    });

    const moduleIds = modules.map(m => m.id);

    const moduleKelas = await prisma.moduleKelas.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { kelasId: true }
    });
    
    const uniqueClassIds = Array.from(new Set(moduleKelas.map(c => c.kelasId)));

    const students = await prisma.user.findMany({
      where: {
        role: 'SISWA',
        kelasId: { in: uniqueClassIds }
      },
      include: {
        kelas: true,
        submissions: {
          where: { moduleItem: { moduleId: { in: moduleIds } } }
        },
        quizAttempts: {
          where: { quiz: { moduleId: { in: moduleIds } } },
          orderBy: { startedAt: 'desc' } // Ambil percobaan kuis terbaru
        }
      },
      orderBy: [
        { kelas: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ modules, students }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal mengambil data rekap.' }, { status: 500 });
  }
}
