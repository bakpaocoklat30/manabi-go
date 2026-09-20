import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ClientLayoutWrapper from './ClientLayoutWrapper';

export default async function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Ambil detail data profil & kelas siswa
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      kelas: true,
    },
  });

  if (!user || user.role !== 'SISWA') {
    redirect('/unauthorized');
  }

  return (
    <ClientLayoutWrapper
      userName={user.name}
      nisn={user.identifier}
      kelasName={user.kelas?.name ?? 'Kelas Belum Ditentukan'}
      driveFolderUrl={user.kelas?.driveFolderUrl ?? null}
    >
      {children}
    </ClientLayoutWrapper>
  );
}