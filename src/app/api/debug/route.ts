import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accesses = await prisma.moduleAccess.findMany({
    include: {
      student: { select: { id: true, name: true, kelasId: true } },
      module: { select: { id: true, title: true } }
    }
  });
  
  const users = await prisma.user.findMany({ where: { role: 'SISWA' }, select: { id: true, name: true, kelasId: true } });
  
  return NextResponse.json({ 
    totalAccesses: accesses.length, 
    accesses,
    totalUsers: users.length,
    users
  });
}
