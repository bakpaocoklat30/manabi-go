import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'SISWA') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const studentId = session.user.id;
    const resolvedParams = await params;
    const moduleId = resolvedParams.id;
    
    // Default to true if not provided (for older clients if any)
    let isInitial = true;
    try {
      const body = await req.json();
      if (typeof body.isInitial === 'boolean') {
        isInitial = body.isInitial;
      }
    } catch (e) {
      // Ignore json parsing error, assume initial
    }

    if (isInitial) {
      // Just record they opened it, don't increment duration yet
      await prisma.moduleAccess.upsert({
        where: {
          studentId_moduleId: {
            studentId,
            moduleId
          }
        },
        update: {}, // Do nothing if exists, keep the first accessedAt time
        create: {
          studentId,
          moduleId
        }
      });
    } else {
      // Increment duration by 30 seconds
      await prisma.moduleAccess.updateMany({
        where: {
          studentId,
          moduleId
        },
        data: {
          durationSeconds: { increment: 30 }
        }
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
