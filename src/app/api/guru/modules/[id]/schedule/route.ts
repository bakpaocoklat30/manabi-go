import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'GURU') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const params = await context.params;
    const moduleId = params.id;

    // Ambil semua kelas di sistem
    const allClasses = await prisma.kelas.findMany({
      orderBy: { name: 'asc' }
    });

    // Ambil assignment yang sudah ada untuk modul ini
    const assignments = await prisma.moduleKelas.findMany({
      where: { moduleId }
    });

    // Format menjadi array untuk state React
    const classesData = allClasses.map(c => {
      const existing = assignments.find(a => a.kelasId === c.id);
      return {
        id: c.id,
        name: c.name,
        isSelected: !!existing,
        publishAt: existing?.publishAt ? existing.publishAt.toISOString() : null,
        dueDate: existing?.dueDate ? existing.dueDate.toISOString() : null
      };
    });

    return NextResponse.json({ classes: classesData }, { status: 200 });
  } catch (error) {
    console.error('GET Schedule Error:', error);
    return NextResponse.json({ message: 'Gagal memuat jadwal' }, { status: 500 });
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
    const { schedules } = body;

    // Gunakan transaksi untuk menghapus yang lama dan menimpa dengan yang baru
    await prisma.$transaction(async (tx) => {
      // Hapus assignment sebelumnya untuk modul ini
      await tx.moduleKelas.deleteMany({
        where: { moduleId }
      });

      // Insert yang baru
      if (schedules && schedules.length > 0) {
        await tx.moduleKelas.createMany({
          data: schedules.map((s: any) => ({
            moduleId,
            kelasId: s.kelasId,
            publishAt: s.publishAt ? new Date(s.publishAt) : null,
            dueDate: s.dueDate ? new Date(s.dueDate) : null,
          }))
        });
        
        // Tandai modul sebagai sudah dipublish
        await tx.learningModule.update({
          where: { id: moduleId },
          data: { isPublished: true }
        });
      } else {
        // Jika tidak ada kelas yang dipilih, kembalikan ke draft
        await tx.learningModule.update({
          where: { id: moduleId },
          data: { isPublished: false }
        });
      }
    });

    return NextResponse.json({ message: 'Jadwal berhasil disimpan' }, { status: 200 });
  } catch (error) {
    console.error('POST Schedule Error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan jadwal' }, { status: 500 });
  }
}
