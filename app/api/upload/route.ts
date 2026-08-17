import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { pngBase64, gifBase64 } = await req.json();

    if (!pngBase64 || !gifBase64) {
      return NextResponse.json({ error: 'Missing images' }, { status: 400 });
    }

    // 1. Convert base64 to buffer
    const pngBuffer = Buffer.from(pngBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const gifBuffer = Buffer.from(gifBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    // 2. Tentukan nama file unik dan path penyimpanannya
    const timestamp = Date.now();
    const pngFilename = `photo_${timestamp}.png`;
    const gifFilename = `photo_${timestamp}.gif`;

    // Untuk environment production di Hostinger Node.js, `public/uploads` adalah folder yang tepat 
    // agar file bisa diakses langsung via URL /uploads/...
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Pastikan folder uploads ada
    await fs.mkdir(uploadDir, { recursive: true });

    const pngFilePath = path.join(uploadDir, pngFilename);
    const gifFilePath = path.join(uploadDir, gifFilename);

    // 3. Simpan file ke disk server (cPanel Hostinger)
    await fs.writeFile(pngFilePath, pngBuffer);
    await fs.writeFile(gifFilePath, gifBuffer);

    // 4. Simpan record ke database MySQL
    const session = await db.sessionData.create({
      data: {
        pngPath: `/uploads/${pngFilename}`,
        gifPath: `/uploads/${gifFilename}`
      }
    });

    // 5. Kembalikan ID session untuk di-generate jadi QR Code
    return NextResponse.json({ 
      success: true, 
      id: session.id,
      pngUrl: `/uploads/${pngFilename}`,
      gifUrl: `/uploads/${gifFilename}`
    });

  } catch (error) {
    console.error('Error uploading photos:', error);
    return NextResponse.json({ error: 'Failed to upload and save data' }, { status: 500 });
  }
}
