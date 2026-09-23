import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const settings = await prisma.systemSetting.findMany();
    const data = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    return NextResponse.json({ settings: data });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const { settings } = await req.json(); // { gdrive_client_id: '...', api_sudarmono: '...' }

    // Uji Koneksi API Gemini jika dimasukkan
    if (settings.gemini_api_key && String(settings.gemini_api_key).trim() !== '') {
      try {
        const apiKey = String(settings.gemini_api_key).trim();
        
        let chosenModel = '';
        
        if (settings.gemini_model_name && String(settings.gemini_model_name).trim() !== '') {
          chosenModel = String(settings.gemini_model_name).trim();
          if (!chosenModel.startsWith('models/')) chosenModel = `models/${chosenModel}`;
        } else {
          // 1. Dapatkan daftar model yang didukung oleh API Key ini (Auto-detect)
          const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          if (!modelsRes.ok) {
            const errData = await modelsRes.json().catch(() => ({}));
            return NextResponse.json({ 
              message: `API Key ditolak Google: ${errData.error?.message || modelsRes.statusText}` 
            }, { status: 400 });
          }
          
          const modelsData = await modelsRes.json();
          const validModels = (modelsData.models || []).filter((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('gemini')
          );
          
          if (validModels.length === 0) {
            return NextResponse.json({ message: `API Key valid, namun tidak ada model Gemini yang tersedia di akun/wilayah ini.` }, { status: 400 });
          }
          
          // Pilih model yang tersedia (prioritaskan flash)
          chosenModel = validModels.find((m: any) => m.name.includes('flash'))?.name || validModels[0].name;
        }

        // 2. Uji model yang terpilih
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${chosenModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "test" }] }],
            generationConfig: { maxOutputTokens: 5 }
          })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return NextResponse.json({ 
            message: `Uji model ${chosenModel} gagal: ${errData.error?.message || res.statusText}` 
          }, { status: 400 });
        }
        
        // Simpan nama model yang berhasil dites agar dipakai oleh Quiz Submit
        settings.gemini_model_name = chosenModel;

      } catch (e: any) {
        return NextResponse.json({ message: 'Gagal menghubungi server Google Gemini API. Pastikan internet server stabil.' }, { status: 400 });
      }
    }

    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }

    return NextResponse.json({ message: 'Pengaturan berhasil diverifikasi dan disimpan.' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
