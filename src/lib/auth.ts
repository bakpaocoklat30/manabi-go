import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

const defaultSecret = 'super_secret_manabi_adb_token_key_2026';
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || defaultSecret;

// Deteksi apakah aplikasi diakses lewat HTTPS atau HTTP biasa (IP publik)
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') || false;

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 Hari
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Konfigurasi cookie eksplisit agar browser tidak menolak cookie saat diakses via HTTP (IP Publik)
  cookies: {
    sessionToken: {
      name: useSecureCookies ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: useSecureCookies ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: useSecureCookies ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'NISN / NIP / Username', type: 'text' },
        password: { label: 'Kata Sandi', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Identitas (NISN/NIP) dan kata sandi wajib diisi.');
        }

        const identifier = String(credentials.identifier).trim();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: { identifier },
        });

        if (!user || !user.isActive) {
          throw new Error('Akun tidak ditemukan atau status dinonaktifkan.');
        }

        const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordMatch) {
          throw new Error('Kata sandi yang Anda masukkan tidak sesuai.');
        }

        return {
          id: user.id,
          identifier: user.identifier,
          name: user.name,
          role: user.role,
          kelasId: user.kelasId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.identifier = user.identifier as string;
        token.role = user.role;
        token.kelasId = user.kelasId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.identifier = token.identifier as string;
        session.user.role = token.role as any;
        session.user.kelasId = token.kelasId as string | null | undefined;
      }
      return session;
    },
  },
});