import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'GURU') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const params = await context.params;
    const moduleId = params.id;
    const { items } = await req.json();

    const module = await prisma.learningModule.findUnique({
      where: { id: moduleId, authorId: session.user.id }
    });
    if (!module) return NextResponse.json({ message: 'Modul tidak valid' }, { status: 403 });

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.type === 'QUIZ') {
          await tx.quiz.update({
            where: { id: item.id },
            data: { orderIndex: item.orderIndex }
          });
        } else {
          await tx.moduleItem.update({
            where: { id: item.id },
            data: { orderIndex: item.orderIndex }
          });
        }
      }
    });

    return NextResponse.json({ message: 'Urutan berhasil disimpan!' }, { status: 200 });
  } catch (error) {
    console.error('Reorder Error:', error);
    return NextResponse.json({ message: 'Gagal mengubah urutan' }, { status: 500 });
  }
}
