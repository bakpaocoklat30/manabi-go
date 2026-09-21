import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentType } from '@prisma/client';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'GURU') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const params = await context.params;
    const moduleId = params.id;

    // Pastikan modul ini milik guru tersebut
    const module = await prisma.learningModule.findUnique({
      where: { id: moduleId, authorId: session.user.id },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
        },
        quizzes: true,
      },
    });

    if (!module) {
      return NextResponse.json({ message: 'Modul tidak ditemukan atau Anda tidak memiliki akses.' }, { status: 404 });
    }

    return NextResponse.json({ module, items: module.items }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal mengambil data konten.' }, { status: 500 });
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
    const body = await req.json();
    const { action, itemId, type, title, bodyText, youtubeUrl, audioUrl, gdrivePrompt, orderIndex, dueHours, delayMinutes, maxFiles } = body;

    // Validasi kepemilikan modul
    const module = await prisma.learningModule.findUnique({
      where: { id: moduleId, authorId: session.user.id },
    });
    if (!module) {
      return NextResponse.json({ message: 'Modul tidak valid.' }, { status: 403 });
    }

    if (action === 'CREATE') {
      // Dapatkan order index terakhir
      const lastItem = await prisma.moduleItem.findFirst({
        where: { moduleId },
        orderBy: { orderIndex: 'desc' },
      });
      const newIndex = lastItem ? lastItem.orderIndex + 1 : 1;

      const newItem = await prisma.moduleItem.create({
        data: {
          moduleId,
          type: type as ContentType,
          title,
          bodyText: bodyText || null,
          youtubeUrl: youtubeUrl || null,
          audioUrl: audioUrl || null,
          gdrivePrompt: gdrivePrompt || null,
          dueHours: dueHours ? Number(dueHours) : null,
          maxFiles: maxFiles ? Number(maxFiles) : 1,
          orderIndex: newIndex,
          delayMinutes: delayMinutes ? Number(delayMinutes) : 0,
        },
      });
      return NextResponse.json({ message: 'Konten berhasil ditambahkan', item: newItem }, { status: 201 });
    }

    if (action === 'UPDATE') {
      const updatedItem = await prisma.moduleItem.update({
        where: { id: itemId, moduleId },
        data: {
          type: type as ContentType,
          title,
          bodyText: bodyText || null,
          youtubeUrl: youtubeUrl || null,
          audioUrl: audioUrl || null,
          gdrivePrompt: gdrivePrompt || null,
          dueHours: dueHours ? Number(dueHours) : null,
          maxFiles: maxFiles ? Number(maxFiles) : 1,
          orderIndex: Number(orderIndex),
          delayMinutes: delayMinutes ? Number(delayMinutes) : 0,
        },
      });
      return NextResponse.json({ message: 'Konten berhasil diperbarui', item: updatedItem }, { status: 200 });
    }

    if (action === 'UPDATE_DELAY') {
      const { isQuiz, delayMinutes } = body;
      if (isQuiz) {
        await prisma.quiz.update({
          where: { id: itemId, moduleId },
          data: { delayMinutes: Number(delayMinutes) }
        });
      } else {
        await prisma.moduleItem.update({
          where: { id: itemId, moduleId },
          data: { delayMinutes: Number(delayMinutes) }
        });
      }
      return NextResponse.json({ message: 'Delay diperbarui' }, { status: 200 });
    }

    if (action === 'BATCH_UPDATE') {
      const { items } = body; // Array of { id, type, orderIndex, delayMinutes }
      for (const item of items) {
        if (item.type === 'QUIZ') {
          await prisma.quiz.update({
            where: { id: item.id, moduleId },
            data: { delayMinutes: Number(item.delayMinutes) }
          });
        } else {
          await prisma.moduleItem.update({
            where: { id: item.id, moduleId },
            data: { 
              orderIndex: Number(item.orderIndex),
              delayMinutes: Number(item.delayMinutes)
            }
          });
        }
      }
      return NextResponse.json({ message: 'Urutan & Jeda berhasil disimpan' }, { status: 200 });
    }

    if (action === 'DELETE') {
      await prisma.moduleItem.delete({
        where: { id: itemId, moduleId },
      });
      return NextResponse.json({ message: 'Konten berhasil dihapus' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Aksi tidak valid' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
