import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const UPLOAD_URL = process.env.UPLOAD_API_URL!;
const UPLOAD_SECRET = process.env.UPLOAD_SECRET!;

async function uploadToAssetServer(
  base64: string,
  filename: string,
  mimeType: string,
  appName: string = 'snapkoms'
): Promise<string> {
  // Convert base64 to Blob
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const blob = new Blob([buffer], { type: mimeType });

  const formData = new FormData();
  formData.append('secret', UPLOAD_SECRET);
  formData.append('app', appName);
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
  console.log(`[asset-server][${appName}] Response:`, JSON.stringify(result));

  // Handle berbagai kemungkinan field name dari upload.php
  const fileUrl = result.url || result.file_url || result.path || result.link;
  if (!fileUrl) throw new Error(`Asset server did not return a URL. Response: ${JSON.stringify(result)}`);
  return fileUrl;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, sessionId: incomingSessionId, pngBase64, videoBase64, gifBase64, extension = 'mp4', rawPhotos = [] } = body;

    const timestamp = Date.now();
    const animData = videoBase64 || gifBase64;
    const animExt = extension || 'mp4';
    const animMime = animExt === 'webm' ? 'video/webm' : (animExt === 'gif' ? 'image/gif' : 'video/mp4');

    // 1. ACTION: UPLOAD GIF ONLY (Async update after GIF generation finishes)
    if (action === 'upload-gif' || action === 'upload-video' || (animData && !pngBase64)) {
      if (!incomingSessionId) {
        return NextResponse.json({ error: 'Missing sessionId for animation update' }, { status: 400 });
      }

      const isGif = animExt === 'gif' || (animData && animData.startsWith('data:image/gif'));
      const filename = isGif ? `photo_anim_${timestamp}.gif` : `photo_boomerang_${timestamp}.mp4`;
      const mimeType = isGif ? 'image/gif' : 'video/mp4';
      const appNs = isGif ? `snapkoms_${incomingSessionId}_gif` : `snapkoms_${incomingSessionId}_video`;

      const gifUrl = await uploadToAssetServer(
        animData,
        filename,
        mimeType,
        appNs
      );

      try {
        await db.sessionData.update({
          where: { id: incomingSessionId },
          data: { gifPath: gifUrl },
        });
      } catch (updateErr) {
        console.warn('Prisma update error for gifPath, trying raw query:', updateErr);
        try {
          await db.$executeRawUnsafe(
            `UPDATE SessionData SET gifPath = ? WHERE id = ?`,
            gifUrl, incomingSessionId
          );
        } catch (rawErr) {
          console.error('Raw query update error:', rawErr);
        }
      }

      return NextResponse.json({
        success: true,
        id: incomingSessionId,
        gifUrl,
        videoUrl: gifUrl,
      });
    }

    // 2. ACTION: INITIAL UPLOAD (PNG + 3 Raw Photos uploaded in parallel)
    if (!pngBase64) {
      return NextResponse.json({ error: 'Missing pngBase64 image' }, { status: 400 });
    }

    const sessionId = incomingSessionId || ('c' + timestamp.toString(36) + Math.random().toString(36).substring(2, 7));
    console.log('[upload/initial] sessionId:', sessionId, '| rawPhotos count:', rawPhotos.length);

    const pngUploadPromise = uploadToAssetServer(
      pngBase64,
      `photo_strip_${timestamp}.jpg`,
      'image/jpeg',
      `snapkoms_${sessionId}_strip`
    ).catch((e: Error) => { console.error('[upload/initial] PNG/JPG upload error:', e.message); throw e; });

    const isGifInitial = animExt === 'gif' || (animData && animData.startsWith('data:image/gif'));
    const gifUploadPromise = animData
      ? uploadToAssetServer(
          animData,
          isGifInitial ? `photo_anim_${timestamp}.gif` : `photo_boomerang_${timestamp}.mp4`,
          isGifInitial ? 'image/gif' : 'video/mp4',
          isGifInitial ? `snapkoms_${sessionId}_gif` : `snapkoms_${sessionId}_video`
        )
      : Promise.resolve('');

    const raw1Promise = (rawPhotos && rawPhotos[0])
      ? uploadToAssetServer(
          rawPhotos[0],
          `raw_photo_1_${timestamp}.jpg`,
          'image/jpeg',
          `snapkoms_${sessionId}_raw1`
        )
      : Promise.resolve(null);

    const raw2Promise = (rawPhotos && rawPhotos[1])
      ? uploadToAssetServer(
          rawPhotos[1],
          `raw_photo_2_${timestamp}.jpg`,
          'image/jpeg',
          `snapkoms_${sessionId}_raw2`
        )
      : Promise.resolve(null);

    const raw3Promise = (rawPhotos && rawPhotos[2])
      ? uploadToAssetServer(
          rawPhotos[2],
          `raw_photo_3_${timestamp}.jpg`,
          'image/jpeg',
          `snapkoms_${sessionId}_raw3`
        )
      : Promise.resolve(null);

    const [pngUrl, gifUrl, photo1Url, photo2Url, photo3Url] = await Promise.all([
      pngUploadPromise,
      gifUploadPromise,
      raw1Promise.catch((e: Error) => { console.error('[upload/initial] Raw 1 error:', e.message); return null; }),
      raw2Promise.catch((e: Error) => { console.error('[upload/initial] Raw 2 error:', e.message); return null; }),
      raw3Promise.catch((e: Error) => { console.error('[upload/initial] Raw 3 error:', e.message); return null; }),
    ]);
    console.log('[upload/initial] All uploads done. pngUrl:', pngUrl?.substring(0, 60));

    // Simpan ke database — pakai upsert agar aman jika ID sudah ada (StrictMode / retry)
    try {
      await db.sessionData.upsert({
        where: { id: sessionId },
        create: {
          id: sessionId,
          pngPath: pngUrl,
          gifPath: gifUrl ?? '',
          photo1Path: photo1Url,
          photo2Path: photo2Url,
          photo3Path: photo3Url,
        },
        update: {
          pngPath: pngUrl,
          gifPath: gifUrl ?? '',
          photo1Path: photo1Url,
          photo2Path: photo2Url,
          photo3Path: photo3Url,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma upsert error, mencoba fallback raw query:', dbErr);
      try {
        await db.$executeRawUnsafe(
          `INSERT INTO SessionData (id, pngPath, gifPath, photo1Path, photo2Path, photo3Path, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE pngPath = VALUES(pngPath), gifPath = VALUES(gifPath), photo1Path = VALUES(photo1Path), photo2Path = VALUES(photo2Path), photo3Path = VALUES(photo3Path)`,
          sessionId, pngUrl, gifUrl ?? '', photo1Url, photo2Url, photo3Url
        );
      } catch (rawErr) {
        console.error('Raw upsert fallback error:', rawErr);
        // Return success anyway karena file sudah terupload ke asset server
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


