import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'GURU' && session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    // 1. Ambil Kredensial dari DB
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['gdrive_client_id', 'gdrive_client_secret', 'gdrive_refresh_token', 'gdrive_root_folder_id'] } }
    });

    const config = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    if (!config.gdrive_client_id || !config.gdrive_client_secret || !config.gdrive_refresh_token || !config.gdrive_root_folder_id) {
      return NextResponse.json({ message: 'Google Drive belum dikonfigurasi di Pengaturan.' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      config.gdrive_client_id,
      config.gdrive_client_secret
    );
    oauth2Client.setCredentials({ refresh_token: config.gdrive_refresh_token });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 2. Buat/Cari Folder Utama "Tugas Siswa" di dalam Root Folder
    let tugasFolderId = '';
    const folderRes = await drive.files.list({
      q: `name='Tugas Siswa' and '${config.gdrive_root_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
    });

    if (folderRes.data.files && folderRes.data.files.length > 0) {
      tugasFolderId = folderRes.data.files[0].id || '';
    } else {
      const newFolder = await drive.files.create({
        requestBody: {
          name: 'Tugas Siswa',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [config.gdrive_root_folder_id],
        },
        fields: 'id',
        supportsAllDrives: true,
      });
      tugasFolderId = newFolder.data.id || '';
    }

    // 3. Ambil semua TaskSubmission (Tugas) yang memiliki local driveFileUrl (belum diunggah ke GDrive)
    const submissions = await prisma.taskSubmission.findMany({
      where: {
        driveFileUrl: { startsWith: '/uploads/' }
      },
      include: {
        student: { include: { kelas: true } },
        moduleItem: { include: { module: true } },
      }
    });

    if (submissions.length === 0) {
      return NextResponse.json({ message: 'Semua tugas sudah tersinkronisasi ke Google Drive.' }, { status: 200 });
    }

    let syncedCount = 0;

    for (const sub of submissions) {
      const kelasName = sub.student.kelas?.name || 'Umum';
      const moduleName = sub.moduleItem.module.title;
      const taskTitle = sub.moduleItem.title;
      const studentName = sub.student.name;
      
      const localFilePath = path.join(process.cwd(), 'public', sub.driveFileUrl);

      if (fs.existsSync(localFilePath)) {
        // Penamaan file yang jelas untuk dibaca non-IT: [Nama Kelas] Nama Modul - Nama Tugas - Nama Siswa.ekstensi
        const ext = path.extname(localFilePath);
        const niceFileName = `[${kelasName}] ${moduleName} - ${taskTitle} - ${studentName}${ext}`;
        
        // Upload ke GDrive
        const uploadedFile = await drive.files.create({
          requestBody: {
            name: niceFileName,
            parents: [tugasFolderId],
          },
          media: {
            body: fs.createReadStream(localFilePath),
          },
          fields: 'id, webViewLink',
          supportsAllDrives: true,
        });

        if (uploadedFile.data.webViewLink) {
          // Ubah Permissions agar bisa dilihat siapa saja yang punya link (jika diinginkan)
          await drive.permissions.create({
            fileId: uploadedFile.data.id || '',
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
            supportsAllDrives: true,
          });

          // Update DB, ganti '/uploads/...' dengan link Google Drive
          await prisma.taskSubmission.update({
            where: { id: sub.id },
            data: { driveFileUrl: uploadedFile.data.webViewLink }
          });
          
          syncedCount++;
        }
      }
    }

    return NextResponse.json({ 
      message: `Sinkronisasi berhasil! ${syncedCount} file telah diunggah dan dapat dilihat langsung di folder 'Tugas Siswa' di Google Drive Anda.`,
      syncedCount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Drive Sync Error:', error);
    return NextResponse.json({ message: 'Terjadi kegagalan saat mensinkronisasi ke Google Drive: ' + error.message }, { status: 500 });
  }
}
