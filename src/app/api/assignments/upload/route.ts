import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId || session?.user?.role !== 'SISWA') {
      return NextResponse.json(
        { message: 'Akses ditolak. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const moduleItemId = formData.get('moduleItemId') as string;
    const notes = formData.get('notes') as string | null;
    const file = formData.get('file') as File | null;

    if (!moduleItemId || !file) {
      return NextResponse.json(
        { message: 'File dan parameter moduleItemId wajib disertakan.' },
        { status: 400 }
      );
    }

    // Ambil info user (untuk folder kelas)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.kelasId) {
      return NextResponse.json(
        { message: 'Gagal mendapatkan data kelas siswa.' },
        { status: 400 }
      );
    }

    // Cek apakah sudah ada submission dan sudah dinilai
    const existingSub = await prisma.taskSubmission.findUnique({
      where: { moduleItemId_studentId: { moduleItemId, studentId: userId } }
    });
    
    if (existingSub && existingSub.grade !== null) {
      return NextResponse.json({ message: 'Tugas sudah dinilai dan tidak dapat diubah lagi.' }, { status: 403 });
    }

    // Cek deadline dari ModuleKelas
    const moduleItem = await prisma.moduleItem.findUnique({
      where: { id: moduleItemId },
      include: { module: { include: { assignedTo: true } } }
    });
    
    if (moduleItem) {
      const assignment = moduleItem.module.assignedTo.find(a => a.kelasId === user.kelasId);
      if (assignment && assignment.dueDate) {
        if (new Date() > new Date(assignment.dueDate)) {
          return NextResponse.json({ message: 'Batas waktu pengumpulan tugas sudah berakhir.' }, { status: 403 });
        }
      }
    }

    // Konversi Blob menjadi Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Buat path penyimpanan: public/uploads/{kelasId}/{moduleItemId}/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', user.kelasId, moduleItemId);
    await fs.mkdir(uploadDir, { recursive: true });

    // Sanitize filename & pastikan unik
    const extension = path.extname(file.name) || '.jpg';
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${user.identifier}_${Date.now()}_${safeName}`;
    const filePath = path.join(uploadDir, filename);

    // Simpan ke disk server
    await fs.writeFile(filePath, buffer);

    // URL publik yang bisa diakses dari browser
    const relativeUrl = `/uploads/${user.kelasId}/${moduleItemId}/${filename}`;

    // Lakukan upsert ke Database
    const submission = await prisma.taskSubmission.upsert({
      where: {
        moduleItemId_studentId: {
          moduleItemId,
          studentId: userId,
        },
      },
      update: {
        driveFileUrl: relativeUrl,
        notes: notes || null,
        updatedAt: new Date(),
      },
      create: {
        moduleItemId,
        studentId: userId,
        driveFileUrl: relativeUrl,
        notes: notes || null,
      },
    });

    return NextResponse.json(
      { message: 'Berkas tugas berhasil disimpan ke server lokal.', data: submission },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error API Local Upload:', error);
    return NextResponse.json(
      { message: 'Terjadi kegagalan server saat menyimpan berkas.' },
      { status: 500 }
    );
  }
}
