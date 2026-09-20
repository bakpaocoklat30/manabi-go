import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        kelas: {
          select: { name: true },
        },
      },
    });

    const classes = await prisma.kelas.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users, classes }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error API Get Users:', error);
    return NextResponse.json({ message: 'Gagal mengambil data pengguna.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // Aksi 1: Registrasi Pengguna Tunggal
    if (action === 'CREATE_SINGLE') {
      const { identifier, name, password, role, kelasId } = body;

      if (!identifier || !name || !password || !role) {
        return NextResponse.json(
          { message: 'Semua field wajib diisi lengkap.' },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({
        where: { identifier: String(identifier).trim() },
      });

      if (existing) {
        return NextResponse.json(
          { message: `Pengguna dengan identitas "${identifier}" sudah terdaftar.` },
          { status: 409 }
        );
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(String(password), saltRounds);

      const newUser = await prisma.user.create({
        data: {
          identifier: String(identifier).trim(),
          name: String(name).trim(),
          passwordHash,
          role: role as Role,
          kelasId: role === 'SISWA' && kelasId ? kelasId : null,
        },
      });

      return NextResponse.json(
        { message: 'Pengguna berhasil didaftarkan.', user: newUser },
        { status: 201 }
      );
    }

    // Aksi 2: Bulk Import Siswa via CSV Text Array
    if (action === 'BULK_IMPORT_CSV') {
      const { rows } = body; // Array of { identifier, name, kelasName, password }

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { message: 'Data baris CSV tidak boleh kosong.' },
          { status: 400 }
        );
      }

      const saltRounds = 10;
      let insertedCount = 0;
      let skippedCount = 0;

      // Ambil daftar seluruh kelas untuk lookup instan
      const existingClasses = await prisma.kelas.findMany();
      const classMap = new Map(existingClasses.map((c) => [c.name.toLowerCase().trim(), c.id]));

      for (const row of rows) {
        const identifier = String(row.identifier || '').trim();
        const name = String(row.name || '').trim();
        const rawKelas = String(row.kelasName || '').toLowerCase().trim();
        const plainPassword = String(row.password || 'adb12345').trim();

        if (!identifier || !name) {
          skippedCount++;
          continue;
        }

        const existingUser = await prisma.user.findUnique({ where: { identifier } });
        if (existingUser) {
          skippedCount++;
          continue;
        }

        const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
        const matchedKelasId = classMap.get(rawKelas) || null;

        await prisma.user.create({
          data: {
            identifier,
            name,
            passwordHash,
            role: Role.SISWA,
            kelasId: matchedKelasId,
          },
        });

        insertedCount++;
      }

      return NextResponse.json(
        {
          message: `Bulk import selesai: ${insertedCount} siswa berhasil didaftarkan, ${skippedCount} dilewati (duplikat/tidak lengkap).`,
          insertedCount,
          skippedCount,
        },
        { status: 200 }
      );
    }

    // Aksi 3: Edit Pengguna
    if (action === 'UPDATE') {
      const { id, name, identifier, kelasId } = body;
      if (!id || !name || !identifier) {
        return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name: String(name).trim(),
          identifier: String(identifier).trim(),
          kelasId: kelasId || null,
        }
      });
      return NextResponse.json({ message: 'Pengguna berhasil diperbarui', user: updatedUser }, { status: 200 });
    }

    // Aksi 4: Hapus Pengguna
    if (action === 'DELETE') {
      const { id } = body;
      if (!id) return NextResponse.json({ message: 'ID diperlukan.' }, { status: 400 });
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({ message: 'Pengguna berhasil dihapus' }, { status: 200 });
    }

    // Aksi 5: Reset Password
    if (action === 'RESET_PASSWORD') {
      const { id, password } = body;
      if (!id || !password) return NextResponse.json({ message: 'ID dan Password baru diperlukan.' }, { status: 400 });
      const passwordHash = await bcrypt.hash(String(password), 10);
      await prisma.user.update({ where: { id }, data: { passwordHash } });
      return NextResponse.json({ message: 'Password berhasil direset' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Error API User Management:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem saat memproses pengguna.' }, { status: 500 });
  }
}