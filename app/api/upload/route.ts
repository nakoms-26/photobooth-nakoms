import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const UPLOAD_URL = process.env.UPLOAD_API_URL!;
const UPLOAD_SECRET = process.env.UPLOAD_SECRET!;

async function uploadToAssetServer(base64: string, filename: string, mimeType: string): Promise<string> {
  // Convert base64 to Blob
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const blob = new Blob([buffer], { type: mimeType });

  const formData = new FormData();
  formData.append('secret', UPLOAD_SECRET);
  formData.append('app', 'snapkoms');
  formData.append('file', blob, filename);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Asset server error: ${response.status} - ${text}`);
  }

  const result = await response.json();
  console.log('[asset-server] Response:', JSON.stringify(result));

  // Handle berbagai kemungkinan field name dari upload.php
  const fileUrl = result.url || result.file_url || result.path || result.link;
  if (!fileUrl) throw new Error(`Asset server did not return a URL. Response: ${JSON.stringify(result)}`);
  return fileUrl;
}

export async function POST(req: Request) {
  try {
    const { pngBase64, gifBase64, rawPhotos = [] } = await req.json();

    if (!pngBase64 || !gifBase64) {
      return NextResponse.json({ error: 'Missing images' }, { status: 400 });
    }

    const timestamp = Date.now();

    // 1. Upload file utama (PNG strip & GIF)
    const [pngUrl, gifUrl] = await Promise.all([
      uploadToAssetServer(pngBase64, `photo_strip_${timestamp}.png`, 'image/png'),
      uploadToAssetServer(gifBase64, `photo_anim_${timestamp}.gif`, 'image/gif'),
    ]);

    // 2. Upload raw photos dengan safe fallback (jika salah satu gagal tidak membatalkan seluruh sesi)
    let photo1Url: string | null = null;
    let photo2Url: string | null = null;
    let photo3Url: string | null = null;

    if (rawPhotos && rawPhotos.length > 0) {
      const rawUploadResults = await Promise.allSettled([
        rawPhotos[0] ? uploadToAssetServer(rawPhotos[0], `raw_photo_1_${timestamp}.png`, 'image/png') : Promise.resolve(null),
        rawPhotos[1] ? uploadToAssetServer(rawPhotos[1], `raw_photo_2_${timestamp}.png`, 'image/png') : Promise.resolve(null),
        rawPhotos[2] ? uploadToAssetServer(rawPhotos[2], `raw_photo_3_${timestamp}.png`, 'image/png') : Promise.resolve(null),
      ]);

      if (rawUploadResults[0]?.status === 'fulfilled') photo1Url = rawUploadResults[0].value;
      if (rawUploadResults[1]?.status === 'fulfilled') photo2Url = rawUploadResults[1].value;
      if (rawUploadResults[2]?.status === 'fulfilled') photo3Url = rawUploadResults[2].value;
    }

    // 3. Simpan ke database dengan fallback aman jika Prisma client belum di-restart
    let sessionId: string;
    try {
      const session = await db.sessionData.create({
        data: {
          pngPath: pngUrl,
          gifPath: gifUrl,
          photo1Path: photo1Url,
          photo2Path: photo2Url,
          photo3Path: photo3Url,
        }
      });
      sessionId = session.id;
    } catch (dbErr) {
      console.warn('Prisma create error, mencoba fallback raw query:', dbErr);
      try {
        const generatedId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
        await db.$executeRawUnsafe(
          `INSERT INTO SessionData (id, pngPath, gifPath, photo1Path, photo2Path, photo3Path, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          generatedId, pngUrl, gifUrl, photo1Url, photo2Url, photo3Url
        );
        sessionId = generatedId;
      } catch (rawErr) {
        console.warn('Raw query fallback error, fallback ke standard fields:', rawErr);
        const fallbackSession = await db.sessionData.create({
          data: {
            pngPath: pngUrl,
            gifPath: gifUrl,
          }
        });
        sessionId = fallbackSession.id;
      }
    }

    return NextResponse.json({
      success: true,
      id: sessionId,
      pngUrl,
      gifUrl,
      photo1Url,
      photo2Url,
      photo3Url,
    });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to upload and save data';
    console.error('Error uploading photos:', error);
    return NextResponse.json({ 
      error: errorMsg,
      details: String(error)
    }, { status: 500 });
  }
}

