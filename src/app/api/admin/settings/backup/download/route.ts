import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ message: 'fileId wajib disertakan.' }, { status: 400 });
    }

    // Fetch credentials
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

    const oAuth2Client = new google.auth.OAuth2(
      config.gdrive_client_id,
      config.gdrive_client_secret
    );
    oAuth2Client.setCredentials({ refresh_token: config.gdrive_refresh_token });
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // Ambil info nama file
    const metaRes = await drive.files.get({
      fileId,
      fields: 'id, name, size',
      supportsAllDrives: true,
    });

    const fileName = metaRes.data.name || `backup_${fileId}.zip`;

    // Download media
    const response = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' }
    );
    const buffer = Buffer.from(response.data as ArrayBuffer);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error('Download From Drive Error:', err);
    return NextResponse.json({ message: err.message || 'Gagal mengunduh file backup dari Google Drive' }, { status: 500 });
  }
}
