import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'GURU' },
      include: {
        taughtClasses: true
      },
      orderBy: { name: 'asc' }
    });

    const classes = await prisma.kelas.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ teachers, classes });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const { teacherId, classIds } = await req.json(); // classIds array of string

    // Update implicitly many-to-many
    await prisma.user.update({
      where: { id: teacherId },
      data: {
        taughtClasses: {
          set: classIds.map((id: string) => ({ id }))
        }
      }
    });

    return NextResponse.json({ message: 'Berhasil menyimpan pengaturan kelas.' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
