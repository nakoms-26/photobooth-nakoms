import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let count = 0;
    try {
      count = await db.sessionData.count();
    } catch {
      // Raw query fallback
      const rawRes = await db.$queryRawUnsafe<Array<{ count: bigint | number }>>(
        'SELECT COUNT(*) as count FROM SessionData'
      );
      if (rawRes && rawRes.length > 0) {
        count = Number(rawRes[0].count);
      }
    }

    return NextResponse.json({
      success: true,
      totalPhotos: count,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, totalPhotos: 0, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
