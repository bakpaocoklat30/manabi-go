import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    if (!userId || (userRole !== 'GURU' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { message: 'Akses ditolak. Tindakan ini hanya diperuntukkan bagi pengajar.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { submissionId, grade, feedback } = body;

    if (!submissionId || grade === undefined || grade === null) {
      return NextResponse.json(
        { message: 'ID pengumpulan tugas dan nilai angka wajib disertakan.' },
        { status: 400 }
      );
    }

    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      return NextResponse.json(
        { message: 'Nilai harus berupa angka valid dalam rentang 0 hingga 100.' },
        { status: 400 }
      );
    }

    // Update data nilai dan catatan guru
    const updated = await prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        grade: numericGrade,
        feedback: feedback ? String(feedback).trim() : null,
        gradedById: userId,
        gradedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Nilai dan evaluasi tulisan siswa berhasil disimpan.', data: updated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error API Grade Submission:', error);
    return NextResponse.json(
      { message: 'Terjadi kegagalan saat menyimpan penilaian di basis data.' },
      { status: 500 }
    );
  }
}