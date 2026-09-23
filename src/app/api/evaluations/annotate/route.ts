import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    if (!userId || (userRole !== 'GURU' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya guru atau admin yang dapat menyimpan anotasi.' },
        { status: 403 }
      );
    }

    let submissionId = '';
    let appendToFeedback = true;
    let imageBuffer: Buffer | null = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      submissionId = (formData.get('submissionId') as string) || '';
      appendToFeedback = formData.get('appendToFeedback') !== 'false';
      const file = formData.get('image') as File | null;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      // JSON fallback (processed WITHOUT ANY REGEX to eliminate call stack overflow)
      const body = await req.json();
      submissionId = body.submissionId || '';
      appendToFeedback = body.appendToFeedback !== false;
      const imageBase64 = body.imageBase64 as string | undefined;

      if (imageBase64 && typeof imageBase64 === 'string') {
        const commaIdx = imageBase64.indexOf(',');
        const rawBase64 = commaIdx !== -1 ? imageBase64.substring(commaIdx + 1) : imageBase64;
        imageBuffer = Buffer.from(rawBase64, 'base64');
      }
    }

    if (!submissionId || !imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json(
        { message: 'ID pengumpulan dan data gambar anotasi wajib disertakan.' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'annotated');

    if (!fs.existsSync(uploadDir)) {
      await fsPromises.mkdir(uploadDir, { recursive: true });
    }

    const filename = `annotated_${submissionId}_${Date.now()}.png`;
    const filePath = path.join(uploadDir, filename);

    await fsPromises.writeFile(filePath, imageBuffer);
    const fileUrl = `/uploads/annotated/${filename}`;

    // Update feedback in database if requested
    let updatedSubmission = null;
    if (appendToFeedback) {
      const existing = await prisma.taskSubmission.findUnique({
        where: { id: submissionId },
      });

      if (existing) {
        const feedbackText = existing.feedback || '';
        const newFeedback = feedbackText 
          ? `${feedbackText}\n\n[Hasil Koreksi Sensei](${fileUrl})`
          : `[Hasil Koreksi Sensei](${fileUrl})`;

        updatedSubmission = await prisma.taskSubmission.update({
          where: { id: submissionId },
          data: {
            feedback: newFeedback,
            gradedById: userId,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Anotasi gambar berhasil disimpan.',
      url: fileUrl,
      submission: updatedSubmission,
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error API Annotate:', error);
    return NextResponse.json(
      { message: error?.message || 'Gagal menyimpan anotasi gambar.' },
      { status: 500 }
    );
  }
}
