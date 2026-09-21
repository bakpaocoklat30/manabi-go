
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fsPromises from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId || session?.user?.role !== 'SISWA') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 401 });
    }

    const formData = await req.formData();
    const moduleItemId = formData.get('moduleItemId') as string;
    const notes = formData.get('notes') as string | null;
    
    // Accept multiple files
    const files = formData.getAll('files') as File[];

    if (!moduleItemId) {
      return NextResponse.json({ message: 'Parameter moduleItemId wajib disertakan.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.kelasId) {
      return NextResponse.json({ message: 'Gagal mendapatkan data kelas.' }, { status: 400 });
    }

    const existingSub = await prisma.taskSubmission.findUnique({
      where: { moduleItemId_studentId: { moduleItemId, studentId: userId } }
    });
    
    if (existingSub && existingSub.grade !== null) {
      return NextResponse.json({ message: 'Tugas sudah dinilai.' }, { status: 403 });
    }

    const relativeUrls: string[] = [];

    // Process all files if any
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', user.kelasId, moduleItemId);
      await fsPromises.mkdir(uploadDir, { recursive: true });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name) continue;
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const extension = path.extname(file.name) || '.jpg';
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${user.identifier}_${Date.now()}_${i}_${safeName}`;
        const filePath = path.join(uploadDir, filename);

        await fsPromises.writeFile(filePath, buffer);
        relativeUrls.push(`/uploads/${user.kelasId}/${moduleItemId}/${filename}`);
      }
    }

    // Upsert
    const updateData: any = {
      notes: notes || null,
      updatedAt: new Date(),
    };
    
    const createData: any = {
      moduleItemId,
      studentId: userId,
      driveFileUrl: '',
      notes: notes || null,
    };

    if (relativeUrls.length > 0) {
      updateData.fileUrls = JSON.stringify(relativeUrls);
      updateData.driveFileUrl = relativeUrls[0];
      createData.fileUrls = JSON.stringify(relativeUrls);
      createData.driveFileUrl = relativeUrls[0];
    } else if (existingSub && existingSub.fileUrls) {
      // Keep existing files if they just updated notes
      updateData.fileUrls = existingSub.fileUrls;
      updateData.driveFileUrl = existingSub.driveFileUrl;
    }

    const submission = await prisma.taskSubmission.upsert({
      where: { moduleItemId_studentId: { moduleItemId, studentId: userId } },
      update: updateData,
      create: createData,
    });

    return NextResponse.json({ message: 'Berkas berhasil disimpan.', data: submission }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error API Local Upload:', error);
    return NextResponse.json({ message: 'Terjadi kegagalan server.' }, { status: 500 });
  }
}
