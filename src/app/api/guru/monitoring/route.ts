import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'GURU') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const kelasId = searchParams.get('kelasId');
  // moduleId removed, now fetches all modules

  try {
    const teacherId = session.user.id;

    // Get classes assigned to this teacher
    const classes = await prisma.kelas.findMany({
      where: { teachers: { some: { id: teacherId } } },
      select: { id: true, name: true }
    });

    // If no specific class or module requested, just return available classes and modules
    const modules = await prisma.learningModule.findMany({
      where: { authorId: teacherId },
      select: { id: true, title: true, weekNumber: true, isGamified: true },
      orderBy: { weekNumber: 'asc' }
    });



    let students = [];
    if (kelasId === 'all' || !kelasId) {
      students = await prisma.user.findMany({
        where: { role: 'SISWA', kelasId: { in: classes.map(c => c.id) } },
        select: { id: true, name: true, identifier: true, kelas: { select: { name: true } } },
        orderBy: [{ kelas: { name: 'asc' } }, { name: 'asc' }]
      });
    } else {
      students = await prisma.user.findMany({
        where: { role: 'SISWA', kelasId },
        select: { id: true, name: true, identifier: true, kelas: { select: { name: true } } },
        orderBy: { name: 'asc' }
      });
    }

    // Get access logs for these students on this module
    const accessLogs = await prisma.moduleAccess.findMany({
      where: {
        studentId: { in: students.map(s => s.id) }
      },
      select: { studentId: true, moduleId: true, accessedAt: true, durationSeconds: true }
    });

    const accessMap = new Map();
    accessLogs.forEach(log => {
      if (!accessMap.has(log.studentId)) {
        accessMap.set(log.studentId, {});
      }
      accessMap.get(log.studentId)[log.moduleId] = { accessedAt: log.accessedAt, durationSeconds: log.durationSeconds };
    });

    const monitoringData = students.map(s => {
      const studentAccesses = accessMap.get(s.id) || {};
      const accesses: Record<string, any> = {};
      
      modules.forEach(m => {
        const acc = studentAccesses[m.id];
        accesses[m.id] = {
          hasOpened: !!acc,
          openedAt: acc?.accessedAt || null,
          durationSeconds: acc?.durationSeconds || 0
        };
      });

      return {
        id: s.id,
        name: s.name,
        nis: s.identifier,
        kelasName: s.kelas?.name || 'Tanpa Kelas',
        accesses
      };
    });

    return NextResponse.json({ data: { classes, modules, monitoringData } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
