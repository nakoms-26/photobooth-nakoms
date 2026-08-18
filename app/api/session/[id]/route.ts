import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ found: false, error: 'Missing ID' }, { status: 400 });
    }

    let session = null;
    try {
      session = await db.sessionData.findUnique({
        where: { id },
      });
    } catch {
      // Raw fallback
      const rawRows = await db.$queryRawUnsafe<any[]>(
        'SELECT id, pngPath, gifPath, photo1Path, photo2Path, photo3Path, createdAt FROM SessionData WHERE id = ? LIMIT 1',
        id
      );
      if (rawRows && rawRows.length > 0) {
        session = rawRows[0];
      }
    }

    if (!session) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      data: {
        id: session.id,
        pngPath: session.pngPath,
        gifPath: session.gifPath,
        photo1Path: session.photo1Path,
        photo2Path: session.photo2Path,
        photo3Path: session.photo3Path,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error('Session status API error:', error);
    return NextResponse.json({ found: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
