import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { generateFullBackupZip } from '@/lib/backup';

export const dynamic = 'force-dynamic';

// GET: Unduh file backup ZIP langsung ke browser
export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { zipBuffer, fileName, dump } = await generateFullBackupZip();

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error('Download Backup Error:', err);
    return NextResponse.json({ message: err.message || 'Gagal membuat file backup' }, { status: 500 });
  }
}

// POST: Backup dan upload ke Google Drive
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

    // 2. Dump all DB data and uploads to ZIP
    const { zipBuffer, fileName, dump } = await generateFullBackupZip();

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

    // 5. Upload the ZIP to Google Drive
    const stream = new Readable();
    stream.push(zipBuffer);
    stream.push(null);

    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [backupFolderId]
      },
      media: {
        mimeType: 'application/zip',
        body: stream
      },
      fields: 'id, name, size',
      supportsAllDrives: true
    });

    return NextResponse.json({ 
      message: 'Backup sukses diunggah ke Google Drive!',
      fileId: uploadRes.data.id,
      fileName,
      stats: dump.metadata.counts,
      sizeBytes: zipBuffer.length
    }, { status: 200 });

  } catch (err: any) {
    console.error('Backup Upload Error:', err);
    return NextResponse.json({ message: err.message || 'Gagal melakukan backup' }, { status: 500 });
  }
}
