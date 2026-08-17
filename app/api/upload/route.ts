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
    const { pngBase64, gifBase64 } = await req.json();

    if (!pngBase64 || !gifBase64) {
      return NextResponse.json({ error: 'Missing images' }, { status: 400 });
    }

    const timestamp = Date.now();

    // Upload PNG dan GIF ke asset.bem-unsoed.com secara paralel
    const [pngUrl, gifUrl] = await Promise.all([
      uploadToAssetServer(pngBase64, `photo_${timestamp}.png`, 'image/png'),
      uploadToAssetServer(gifBase64, `photo_${timestamp}.gif`, 'image/gif'),
    ]);

    // Simpan URL ke database MySQL
    const session = await db.sessionData.create({
      data: {
        pngPath: pngUrl,
        gifPath: gifUrl,
      }
    });

    return NextResponse.json({
      success: true,
      id: session.id,
      pngUrl,
      gifUrl,
    });

  } catch (error) {
    console.error('Error uploading photos:', error);
    return NextResponse.json({ error: 'Failed to upload and save data' }, { status: 500 });
  }
}

