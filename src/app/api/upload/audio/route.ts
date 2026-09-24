import { NextResponse } from 'next/server';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Harus login sebagai guru atau admin
    if (!session || (session.user?.role !== 'GURU' && session.user?.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ message: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const extension = path.extname(file.name) || '.mp3';
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `audio_${Date.now()}_${safeName}`;
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
    
    // Pastikan folder tersedia
    await fsPromises.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, filename);
    await fsPromises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/audio/${filename}`;
    
    return NextResponse.json({ url: relativeUrl, message: 'Berhasil mengunggah audio.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error upload audio:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengunggah file.' }, { status: 500 });
  }
}
