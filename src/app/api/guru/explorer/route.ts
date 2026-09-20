import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'GURU') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const submissions = await prisma.taskSubmission.findMany({
      where: {
        driveFileUrl: { not: '' }
      },
      include: {
        student: {
          select: { name: true, identifier: true, kelas: { select: { id: true, name: true } } }
        },
        moduleItem: {
          select: { 
            id: true, 
            title: true,
            module: {
              select: { id: true, title: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Data structure:
    // [ { classId, className, modules: [ { moduleId, moduleTitle, files: [ { submissionId, studentName, fileUrl, createdAt } ] } ] } ]
    const grouped: Record<string, any> = {};

    submissions.forEach(sub => {
      const kelas = sub.student.kelas;
      if (!kelas) return;

      if (!grouped[kelas.id]) {
        grouped[kelas.id] = { id: kelas.id, name: kelas.name, modules: {} };
      }

      // We group by the LearningModule, not the item.
      const mod = sub.moduleItem.module;
      if (!grouped[kelas.id].modules[mod.id]) {
        grouped[kelas.id].modules[mod.id] = { id: mod.id, title: mod.title, files: [] };
      }

      grouped[kelas.id].modules[mod.id].files.push({
        id: sub.id,
        studentName: sub.student.name,
        identifier: sub.student.identifier,
        fileUrl: sub.driveFileUrl,
        createdAt: sub.submittedAt
      });
    });

    const result = Object.values(grouped).map((c: any) => ({
      id: c.id,
      name: c.name,
      modules: Object.values(c.modules)
    }));

    result.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
