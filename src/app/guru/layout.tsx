import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ClientGuruLayoutWrapper from './ClientGuruLayoutWrapper';

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || (user.role !== 'GURU' && user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized');
  }

  // Hitung jumlah tugas menulis yang belum dinilai (grade === null)
  const pendingCount = await prisma.taskSubmission.count({
    where: { grade: null },
  });

  return (
    <ClientGuruLayoutWrapper
      teacherName={user.name}
      nip={user.identifier}
      pendingCount={pendingCount}
    >
      {children}
    </ClientGuruLayoutWrapper>
  );
}