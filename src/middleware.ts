import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'super_secret_manabi_adb_token_key_2026',
  });

  const { pathname } = request.nextUrl;

  // Izinkan asset statis, API auth, dan public folder
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === '/login';

  // 1. Jika belum login dan mencoba mengakses rute internal
  if (!token && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika sudah login dan membuka halaman login, arahkan ke dashboard sesuai role
  if (token && isLoginPage) {
    if (token.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (token.role === 'GURU') {
      return NextResponse.redirect(new URL('/guru', request.url));
    }
    return NextResponse.redirect(new URL('/siswa', request.url));
  }

  // 3. Granular RBAC Guard
  if (pathname.startsWith('/admin') && token?.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/guru') && token?.role !== 'GURU' && token?.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/siswa') && token?.role !== 'SISWA') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/guru/:path*', '/siswa/:path*', '/login'],
};