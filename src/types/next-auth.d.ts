import { Role } from '@prisma/client';
import { DefaultSession } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      identifier: string;
      role: Role;
      kelasId?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    identifier: string;
    name: string;
    role: Role;
    kelasId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    identifier: string;
    role: Role;
    kelasId?: string | null;
  }
}