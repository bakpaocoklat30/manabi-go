import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { generateFullBackupZip } from '@/lib/backup';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Cek pengaturan auto_backup_schedule
    const settings = await prisma.systemSetting.findMany({
      where: { 
        key: { 
          in: [
            'auto_backup_schedule',
            'last_auto_backup_at',
            'gdrive_client_id',
            'gdrive_client_secret',
            'gdrive_refresh_token',
            'gdrive_root_folder_id'
          ] 
        } 
      }
    });

    const config = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const schedule = config.auto_backup_schedule || 'manual';
    if (schedule === 'manual') {
      return NextResponse.json({ 
        status: 'skipped', 
        message: 'Jadwal auto-backup disetel Manual Saja.' 
      }, { status: 200 });
    }

    if (!config.gdrive_client_id || !config.gdrive_client_secret || !config.gdrive_refresh_token || !config.gdrive_root_folder_id) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Kredensial Google Drive belum lengkap untuk auto-backup.' 
      }, { status: 400 });
    }

    // 2. Evaluasi apakah sudah waktunya backup
    const lastBackupTime = config.last_auto_backup_at ? new Date(config.last_auto_backup_at).getTime() : 0;
    const now = Date.now();
    const oneDayMs = 23 * 60 * 60 * 1000;
    const oneWeekMs = 6.5 * 24 * 60 * 60 * 1000;

    if (schedule === 'daily' && (now - lastBackupTime) < oneDayMs) {
      return NextResponse.json({ 
        status: 'skipped', 
        message: 'Backup harian sudah dilakukan dalam 24 jam terakhir.',
        lastBackup: config.last_auto_backup_at
      }, { status: 200 });
    }

    if (schedule === 'weekly' && (now - lastBackupTime) < oneWeekMs) {
      return NextResponse.json({ 
        status: 'skipped', 
        message: 'Backup mingguan sudah dilakukan dalam 7 hari terakhir.',
        lastBackup: config.last_auto_backup_at
      }, { status: 200 });
    }

    // 3. Eksekusi Full Backup
    const { zipBuffer, fileName, dump } = await generateFullBackupZip();

    // 4. Hubungkan Google Drive
    const oAuth2Client = new google.auth.OAuth2(
      config.gdrive_client_id,
      config.gdrive_client_secret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    oAuth2Client.setCredentials({ refresh_token: config.gdrive_refresh_token });
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // Cari/Buat folder "Backup"
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

    // Upload ZIP
    const stream = new Readable();
    stream.push(zipBuffer);
    stream.push(null);

    const uploadRes = await drive.files.create({
      requestBody: {
        name: `AUTO_${fileName}`,
        parents: [backupFolderId]
      },
      media: {
        mimeType: 'application/zip',
        body: stream
      },
      fields: 'id, name, size',
      supportsAllDrives: true
    });

    // Simpan timestamp auto-backup terakhir
    await prisma.systemSetting.upsert({
      where: { key: 'last_auto_backup_at' },
      update: { value: new Date().toISOString() },
      create: { key: 'last_auto_backup_at', value: new Date().toISOString() }
    });

    return NextResponse.json({
      status: 'success',
      message: `Auto-backup (${schedule}) berhasil diunggah!`,
      fileName: `AUTO_${fileName}`,
      fileId: uploadRes.data.id,
      stats: dump.metadata.counts
    }, { status: 200 });

  } catch (err: any) {
    console.error('CRON AUTO BACKUP ERROR:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
