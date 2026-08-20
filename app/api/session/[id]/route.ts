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

    let totalCount = 0;
    let photoNumber: number | null = null;
    try {
      totalCount = await db.sessionData.count();
      if (session.createdAt) {
        photoNumber = await db.sessionData.count({
          where: {
            createdAt: {
              lte: new Date(session.createdAt),
            },
          },
        });
      }
    } catch {
      try {
        const countRes = await db.$queryRawUnsafe<Array<{ count: bigint | number }>>(
          'SELECT COUNT(*) as count FROM SessionData'
        );
        if (countRes && countRes.length > 0) {
          totalCount = Number(countRes[0].count);
        }
        if (session.createdAt) {
          const numRes = await db.$queryRawUnsafe<Array<{ count: bigint | number }>>(
            'SELECT COUNT(*) as count FROM SessionData WHERE createdAt <= ?',
            session.createdAt
          );
          if (numRes && numRes.length > 0) {
            photoNumber = Number(numRes[0].count);
          }
        }
      } catch (err) {
        console.warn('Failed to calculate session sequence count:', err);
      }
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
        totalCount: totalCount > 0 ? totalCount : null,
        photoNumber: photoNumber && photoNumber > 0 ? photoNumber : null,
      },
    });
  } catch (error) {
    console.error('Session status API error:', error);
    return NextResponse.json({ found: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
