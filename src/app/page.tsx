import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function RootPage() {
  const session = await auth();

  // Jika belum terotentikasi, alihkan langsung ke halaman Login
  if (!session?.user) {
    redirect('/login');
  }

  // Alihkan sesuai role pengguna yang login
  const role = session.user.role;

  if (role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  if (role === 'GURU') {
    redirect('/guru');
  }

  if (role === 'SISWA') {
    redirect('/siswa');
  }

  redirect('/login');
}