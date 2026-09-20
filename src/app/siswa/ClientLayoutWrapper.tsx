'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import SakuraBackground from '@/components/shared/SakuraBackground';
import Header from '@/components/layout/Header';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
  userName: string;
  nisn: string;
  kelasName: string;
  driveFolderUrl: string | null;
}

export default function ClientLayoutWrapper({
  children,
  userName,
  nisn,
  kelasName,
  driveFolderUrl,
}: ClientLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col lg:pl-72">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userName={userName}
        nisn={nisn}
        kelasName={kelasName}
      />
      <Header
        onOpenSidebar={() => setIsSidebarOpen(true)}
        driveFolderUrl={driveFolderUrl}
      />
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}