import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manabi Go - Media Belajar Bahasa Jepang STM ADB',
  description: 'Portal Pembelajaran Bahasa & Budaya Industri Jepang SMKN 1 Adiwerna',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#FDFBF7] text-stone-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}