import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { google } from 'googleapis';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // izinkan eksekusi lebih lama

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { fileId } = await req.json();
    if (!fileId) return NextResponse.json({ message: 'File ID tidak valid.' }, { status: 400 });

    // 1. Fetch Google Drive credentials
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['gdrive_client_id', 'gdrive_client_secret', 'gdrive_refresh_token'] } }
    });

    const config = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    if (!config.gdrive_client_id || !config.gdrive_client_secret || !config.gdrive_refresh_token) {
      return NextResponse.json({ message: 'Kredensial Google Drive tidak lengkap.' }, { status: 400 });
    }

    // 2. Auth Drive
    const oAuth2Client = new google.auth.OAuth2(
      config.gdrive_client_id,
      config.gdrive_client_secret
    );
    oAuth2Client.setCredentials({ refresh_token: config.gdrive_refresh_token });
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // 3. Download ZIP file dari Google Drive
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' }
    );
    const buffer = Buffer.from(response.data as ArrayBuffer);

    // 4. Ekstrak ZIP di memori
    const zip = new AdmZip(buffer);
    const dbEntry = zip.getEntry('database.json');
    if (!dbEntry) {
      return NextResponse.json({ message: 'File database.json tidak ditemukan di dalam backup.' }, { status: 400 });
    }

    const dumpStr = dbEntry.getData().toString('utf8');
    const dump = JSON.parse(dumpStr);

    // 5. Ekstrak folder uploads jika ada
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }

    const entries = zip.getEntries();
    for (const entry of entries) {
      if (entry.entryName.startsWith('uploads/')) {
        zip.extractEntryTo(entry, path.join(process.cwd(), 'public'), true, true);
      }
    }

    // 6. Transaksi Delete & Insert (SANGAT BERHATI-HATI DENGAN FOREIGN KEYS)
    // Urutan delete: dari tabel anak ke induk
    await prisma.$transaction(async (tx) => {
      try {
        await tx.$executeRawUnsafe('DELETE FROM "_GuruKelas"');
      } catch (e) {
        console.warn('Membersihkan _GuruKelas:', e);
      }

      await tx.taskSubmission.deleteMany();
      await tx.quizAttempt.deleteMany();
      await tx.option.deleteMany();
      await tx.question.deleteMany();
      await tx.quiz.deleteMany();
      await tx.moduleItem.deleteMany();
      await tx.moduleAccess.deleteMany();
      await tx.moduleKelas.deleteMany();
      await tx.learningModule.deleteMany();
      await tx.attendance.deleteMany();
      await tx.user.deleteMany();
      await tx.kelas.deleteMany();

      // Urutan insert: dari induk ke anak
      if (dump.kelas?.length) await tx.kelas.createMany({ data: dump.kelas });
      if (dump.users?.length) await tx.user.createMany({ data: dump.users });

      // Restore relasi many-to-many Guru & Kelas
      if (dump.guruKelas?.length) {
        for (const rel of dump.guruKelas) {
          try {
            await tx.$executeRawUnsafe(
              'INSERT INTO "_GuruKelas" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
              rel.A,
              rel.B
            );
          } catch (e) {
            console.warn('Gagal restore baris _GuruKelas:', e);
          }
        }
      }

      if (dump.learningModules?.length) await tx.learningModule.createMany({ data: dump.learningModules });
      if (dump.moduleKelas?.length) await tx.moduleKelas.createMany({ data: dump.moduleKelas });
      if (dump.moduleItems?.length) await tx.moduleItem.createMany({ data: dump.moduleItems });
      if (dump.quizzes?.length) await tx.quiz.createMany({ data: dump.quizzes });
      if (dump.questions?.length) await tx.question.createMany({ data: dump.questions });
      if (dump.options?.length) await tx.option.createMany({ data: dump.options });
      if (dump.quizAttempts?.length) await tx.quizAttempt.createMany({ data: dump.quizAttempts });
      if (dump.taskSubmissions?.length) await tx.taskSubmission.createMany({ data: dump.taskSubmissions });
      if (dump.attendances?.length) await tx.attendance.createMany({ data: dump.attendances });
      if (dump.moduleAccess?.length) await tx.moduleAccess.createMany({ data: dump.moduleAccess });
      
      // Catatan: systemSettings tidak di-restore agar tidak merusak koneksi API Google yang aktif sekarang
    }, {
      maxWait: 15000,
      timeout: 120000 // 120 detik karena operasi insert/delete besar
    });

    return NextResponse.json({ 
      message: 'Database dan file berhasil di-restore dari backup!',
      stats: dump.metadata?.counts || null
    }, { status: 200 });

  } catch (err: any) {
    console.error('RESTORE ERROR:', err);
    return NextResponse.json({ message: err.message || 'Terjadi kesalahan saat memulihkan database.' }, { status: 500 });
  }
}
