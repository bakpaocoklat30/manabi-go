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

        // Helper untuk membuat/mencari folder
    async function getOrCreateFolder(folderName: string, parentId: string) {
      const q = `name='${folderName.replace(/'/g, "\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const res = await drive.files.list({
        q,
        fields: 'files(id)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });
      if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id || '';
      }
      const newFolder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        fields: 'id',
        supportsAllDrives: true,
      });
      return newFolder.data.id || '';
    }

    const guruName = session?.user?.name || 'Guru_Tidak_Diketahui';

    // 3. Ambil semua TaskSubmission yang belum tersinkron
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
    
    // Cache folder IDs to avoid redundant API calls
    const folderCache: Record<string, string> = {};

    for (const sub of submissions) {
      const kelasName = sub.student.kelas?.name || 'Kelas_Umum';
      const taskTitle = sub.moduleItem.title;
      const studentName = sub.student.name;
      
      const localFilePath = path.join(process.cwd(), 'public', sub.driveFileUrl);

      if (fs.existsSync(localFilePath)) {
        // Struktur: Guru -> Kelas -> Tugas
        const guruCacheKey = `guru_${guruName}`;
        if (!folderCache[guruCacheKey]) {
          folderCache[guruCacheKey] = await getOrCreateFolder(guruName, config.gdrive_root_folder_id);
        }
        
        const kelasCacheKey = `kelas_${guruName}_${kelasName}`;
        if (!folderCache[kelasCacheKey]) {
          folderCache[kelasCacheKey] = await getOrCreateFolder(kelasName, folderCache[guruCacheKey]);
        }
        
        const taskCacheKey = `task_${kelasName}_${taskTitle}`;
        if (!folderCache[taskCacheKey]) {
          folderCache[taskCacheKey] = await getOrCreateFolder(taskTitle, folderCache[kelasCacheKey]);
        }

        const ext = path.extname(localFilePath);
        const niceFileName = `${studentName}${ext}`;
        
        // Upload ke GDrive di dalam folder tugas
        const uploadedFile = await drive.files.create({
          requestBody: {
            name: niceFileName,
            parents: [folderCache[taskCacheKey]],
          },
          media: {
            body: fs.createReadStream(localFilePath),
          },
          fields: 'id, webViewLink',
          supportsAllDrives: true,
        });

        if (uploadedFile.data.webViewLink) {
          await drive.permissions.create({
            fileId: uploadedFile.data.id || '',
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
            supportsAllDrives: true,
          });

          await prisma.taskSubmission.update({
            where: { id: sub.id },
            data: { driveFileUrl: uploadedFile.data.webViewLink }
          });
          
          syncedCount++;
        }
      }
    }

    return NextResponse.json({ 
      message: `Sinkronisasi berhasil! ${syncedCount} file telah diunggah dengan struktur folder yang rapi di Google Drive.`,
      syncedCount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Drive Sync Error:', error);
    return NextResponse.json({ message: 'Terjadi kegagalan saat mensinkronisasi ke Google Drive: ' + error.message }, { status: 500 });
  }
}
