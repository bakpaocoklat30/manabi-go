import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { google } from 'googleapis';
import { Readable } from 'stream';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 1. Fetch credentials
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['gdrive_client_id', 'gdrive_client_secret', 'gdrive_refresh_token', 'gdrive_root_folder_id'] } }
    });

    const config = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    if (!config.gdrive_client_id || !config.gdrive_client_secret || !config.gdrive_refresh_token || !config.gdrive_root_folder_id) {
      return NextResponse.json({ message: 'Kredensial atau ID Folder belum lengkap di Pengaturan.' }, { status: 400 });
    }

    // 2. Dump all DB data to JSON
        const dump = {
      users: await prisma.user.findMany(),
      kelas: await prisma.kelas.findMany(),
      learningModules: await prisma.learningModule.findMany(),
      moduleItems: await prisma.moduleItem.findMany(),
      questions: await prisma.question.findMany(),
      taskSubmissions: await prisma.taskSubmission.findMany(),
      systemSettings: await prisma.systemSetting.findMany(),
      // Tambahan tabel lengkap
      moduleKelas: await prisma.moduleKelas.findMany(),
      quizzes: await prisma.quiz.findMany(),
      options: await prisma.option.findMany(),
      quizAttempts: await prisma.quizAttempt.findMany(),
      attendances: await prisma.attendance.findMany(),
      moduleAccess: await prisma.moduleAccess.findMany(),
      timestamp: new Date().toISOString()
    };

    const jsonString = JSON.stringify(dump, null, 2);

    // 3. Authenticate with Google Drive
    const oAuth2Client = new google.auth.OAuth2(
      config.gdrive_client_id,
      config.gdrive_client_secret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    oAuth2Client.setCredentials({ refresh_token: config.gdrive_refresh_token });
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // 4. Find or Create "Backup" Folder inside root folder
    let backupFolderId = '';
    const searchRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='Backup' and '${config.gdrive_root_folder_id}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      backupFolderId = searchRes.data.files[0].id!;
    } else {
      const folderRes = await drive.files.create({
        requestBody: {
          name: 'Backup',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [config.gdrive_root_folder_id]
        },
        fields: 'id',
        supportsAllDrives: true
      });
      backupFolderId = folderRes.data.id!;
    }

    // 5. Upload the JSON dump
    const fileName = `manabi_go_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    
    // Create ZIP in memory
    const zip = new AdmZip();
    zip.addFile('database.json', Buffer.from(jsonString, 'utf8'));
    
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsPath)) {
      zip.addLocalFolder(uploadsPath, 'uploads');
    }

    const zipBuffer = zip.toBuffer();

    const stream = new Readable();
    stream.push(zipBuffer);
    stream.push(null);

    await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [backupFolderId]
      },
      media: {
        mimeType: 'application/zip',
        body: stream
      },
      supportsAllDrives: true
    });

    return NextResponse.json({ message: 'Backup sukses!' }, { status: 200 });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: err.message || 'Gagal melakukan backup' }, { status: 500 });
  }
}
