import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ClientAdminLayoutWrapper from './ClientAdminLayoutWrapper';

export default async function AdminLayout({
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

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <ClientAdminLayoutWrapper
      adminName={user.name}
      identifier={user.identifier}
    >
      {children}
    </ClientAdminLayoutWrapper>
  );
}