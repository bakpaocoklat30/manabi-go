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
      orderBy: { weekNumber: 'asc' },
      include: {
        _count: {
          select: { items: true, quizzes: true }
        }
      }
    });

    return NextResponse.json({ modules }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal mengambil data modul.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'GURU') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const { action, id, title, weekNumber, description, isGamified } = await req.json();

    if (action === 'CREATE') {
      const newModule = await prisma.learningModule.create({
        data: {
          title,
          weekNumber: Number(weekNumber),
          description,
          isGamified: isGamified !== undefined ? isGamified : true,
          authorId: session.user.id,
        },
      });
      return NextResponse.json({ message: 'Modul berhasil dibuat', module: newModule }, { status: 201 });
    }

    if (action === 'UPDATE') {
      const updatedModule = await prisma.learningModule.update({
        where: { id, authorId: session.user.id },
        data: {
          title,
          weekNumber: Number(weekNumber),
          description,
          isGamified: isGamified !== undefined ? isGamified : true,
          },
      });
      return NextResponse.json({ message: 'Modul berhasil diperbarui', module: updatedModule }, { status: 200 });
    }

    if (action === 'DELETE') {
      await prisma.learningModule.delete({
        where: { id, authorId: session.user.id },
      });
      return NextResponse.json({ message: 'Modul berhasil dihapus' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Aksi tidak valid' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
