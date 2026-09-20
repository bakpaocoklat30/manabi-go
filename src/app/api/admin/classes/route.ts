import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const classesRaw = await prisma.kelas.findMany({
      include: {
        students: { select: { id: true, role: true, name: true, identifier: true } },
        teachers: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });

    const classes = classesRaw.map(c => ({
      id: c.id,
      name: c.name,
      jurusan: c.jurusan,
      driveFolderUrl: c.driveFolderUrl,
      teachers: c.teachers,
      _count: { students: c.students.filter(s => s.role === 'SISWA').length }
    }));

    const unassignedStudents = await prisma.user.findMany({
      where: { role: 'SISWA', kelasId: null },
      select: { id: true, name: true, identifier: true }
    });

    

    return NextResponse.json({ classes, unassignedStudents }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'CREATE') {
      const { name, jurusan, driveFolderUrl } = body;
      const newClass = await prisma.kelas.create({
        data: { name, jurusan, driveFolderUrl }
      });
      return NextResponse.json({ message: 'Kelas berhasil dibuat', newClass }, { status: 201 });
    }

    if (action === 'ASSIGN_STUDENT') {
      const { kelasId, studentId } = body;
      await prisma.user.update({
        where: { id: studentId },
        data: { kelasId }
      });
      return NextResponse.json({ message: 'Siswa berhasil dimasukkan ke kelas' }, { status: 200 });
    }

    

    if (action === 'DELETE') {
        const { kelasId } = body;
        await prisma.kelas.delete({
            where: { id: kelasId }
        });
        return NextResponse.json({ message: 'Kelas berhasil dihapus' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

