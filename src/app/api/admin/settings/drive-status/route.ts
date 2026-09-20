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
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['gdrive_client_id', 'gdrive_client_secret', 'gdrive_refresh_token'] } }
    });

    const config = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    if (!config.gdrive_client_id || !config.gdrive_client_secret || !config.gdrive_refresh_token) {
      return NextResponse.json({ status: 'NOT_CONFIGURED', message: 'Kredensial belum lengkap.' }, { status: 200 });
    }

    const oAuth2Client = new google.auth.OAuth2(
      config.gdrive_client_id,
      config.gdrive_client_secret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    oAuth2Client.setCredentials({ refresh_token: config.gdrive_refresh_token });

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    const res = await drive.about.get({ fields: 'storageQuota' });
    
    return NextResponse.json({ 
      status: 'CONNECTED', 
      storageQuota: res.data.storageQuota 
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ 
      status: 'ERROR', 
      message: err.message || 'Gagal terhubung ke Google Drive' 
    }, { status: 200 });
  }
}
