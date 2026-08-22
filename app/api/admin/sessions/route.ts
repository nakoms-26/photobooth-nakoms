import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export interface AdminSessionItem {
  id: string;
  pngPath: string;
  gifPath?: string | null;
  photo1Path?: string | null;
  photo2Path?: string | null;
  photo3Path?: string | null;
  createdAt: string;
}

const ADMIN_PASSWORD = 'kandangwebs';

export async function GET(req: Request) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    if (adminKey && adminKey !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim() || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 500) : 100;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const skip = (page - 1) * limit;

    let totalCount = 0;
    let sessions: AdminSessionItem[] = [];

    // Query sessions with Prisma or raw fallback
    try {
      if (search) {
        totalCount = await db.sessionData.count({
          where: {
            OR: [
              { id: { contains: search } },
              { pngPath: { contains: search } },
            ],
          },
        });

        const records = await db.sessionData.findMany({
          where: {
            OR: [
              { id: { contains: search } },
              { pngPath: { contains: search } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });

        sessions = records.map((r) => ({
          id: r.id,
          pngPath: r.pngPath,
          gifPath: r.gifPath,
          photo1Path: r.photo1Path,
          photo2Path: r.photo2Path,
          photo3Path: r.photo3Path,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        }));
      } else {
        totalCount = await db.sessionData.count();

        const records = await db.sessionData.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });

        sessions = records.map((r) => ({
          id: r.id,
          pngPath: r.pngPath,
          gifPath: r.gifPath,
          photo1Path: r.photo1Path,
          photo2Path: r.photo2Path,
          photo3Path: r.photo3Path,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (prismaErr) {
      console.warn('Prisma admin sessions error, trying raw query fallback:', prismaErr);
      try {
        const countRes = await db.$queryRawUnsafe<Array<{ count: bigint | number }>>(
          search
            ? `SELECT COUNT(*) as count FROM SessionData WHERE id LIKE ?`
            : `SELECT COUNT(*) as count FROM SessionData`,
          ...(search ? [`%${search}%`] : [])
        );
        if (countRes && countRes.length > 0) {
          totalCount = Number(countRes[0].count);
        }

        const rawRows = await db.$queryRawUnsafe<Array<{
          id: string;
          pngPath: string;
          gifPath: string;
          photo1Path?: string | null;
          photo2Path?: string | null;
          photo3Path?: string | null;
          createdAt: Date | string;
        }>>(
          search
            ? `SELECT id, pngPath, gifPath, photo1Path, photo2Path, photo3Path, createdAt FROM SessionData WHERE id LIKE ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
            : `SELECT id, pngPath, gifPath, photo1Path, photo2Path, photo3Path, createdAt FROM SessionData ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
          ...(search ? [`%${search}%`, limit, skip] : [limit, skip])
        );

        if (rawRows) {
          sessions = rawRows.map((r) => ({
            id: r.id,
            pngPath: r.pngPath,
            gifPath: r.gifPath,
            photo1Path: r.photo1Path ?? null,
            photo2Path: r.photo2Path ?? null,
            photo3Path: r.photo3Path ?? null,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          }));
        }
      } catch (rawErr) {
        console.error('Fatal raw query error:', rawErr);
      }
    }

    // Additional statistics
    let todayCount = 0;
    let gifCount = 0;
    let rawPhotoCount = 0;

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      todayCount = await db.sessionData.count({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
      });

      gifCount = await db.sessionData.count({
        where: {
          gifPath: {
            not: '',
          },
        },
      });
    } catch {
      // Raw stats fallback
      try {
        const todayRes = await db.$queryRawUnsafe<Array<{ count: bigint | number }>>(
          'SELECT COUNT(*) as count FROM SessionData WHERE createdAt >= CURDATE()'
        );
        if (todayRes && todayRes.length > 0) {
          todayCount = Number(todayRes[0].count);
        }

        const gifRes = await db.$queryRawUnsafe<Array<{ count: bigint | number }>>(
          "SELECT COUNT(*) as count FROM SessionData WHERE gifPath IS NOT NULL AND gifPath != '' AND gifPath != 'PENDING'"
        );
        if (gifRes && gifRes.length > 0) {
          gifCount = Number(gifRes[0].count);
        }
      } catch (e) {
        console.warn('Failed to calculate detailed stats:', e);
      }
    }

    // Approximate total files generated: PNG strip + GIF + 3 raw photos per session
    const estimatedTotalFiles = totalCount * 5;

    return NextResponse.json({
      success: true,
      sessions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        totalSessions: totalCount,
        todaySessions: todayCount,
        gifGenerated: gifCount,
        estimatedTotalFiles,
      },
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    if (adminKey && adminKey !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, ids, scope, date } = body;

    let deletedCount = 0;

    // 1. Delete single session
    if (id) {
      try {
        await db.sessionData.delete({ where: { id } });
        deletedCount = 1;
      } catch {
        const res = await db.$executeRawUnsafe('DELETE FROM SessionData WHERE id = ?', id);
        deletedCount = Number(res);
      }
    }
    // 2. Delete multiple specific IDs
    else if (Array.isArray(ids) && ids.length > 0) {
      try {
        const res = await db.sessionData.deleteMany({
          where: { id: { in: ids } },
        });
        deletedCount = res.count;
      } catch {
        const placeholders = ids.map(() => '?').join(',');
        const res = await db.$executeRawUnsafe(
          `DELETE FROM SessionData WHERE id IN (${placeholders})`,
          ...ids
        );
        deletedCount = Number(res);
      }
    }
    // 3. Delete by Date (e.g. '2026-08-20' or specific YYYY-MM-DD)
    else if (date) {
      try {
        const startDate = new Date(`${date}T00:00:00.000Z`);
        const endDate = new Date(`${date}T23:59:59.999Z`);
        const res = await db.sessionData.deleteMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        deletedCount = res.count;
      } catch {
        const res = await db.$executeRawUnsafe(
          'DELETE FROM SessionData WHERE DATE(createdAt) = DATE(?)',
          date
        );
        deletedCount = Number(res);
      }
    }
    // 4. Delete today's sessions
    else if (scope === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      try {
        const res = await db.sessionData.deleteMany({
          where: {
            createdAt: {
              gte: todayStart,
            },
          },
        });
        deletedCount = res.count;
      } catch {
        const res = await db.$executeRawUnsafe(
          'DELETE FROM SessionData WHERE createdAt >= CURDATE()'
        );
        deletedCount = Number(res);
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Parameter id, ids, date, atau scope tidak valid' },
        { status: 400 }
      );
    }

    const remainingCount = await db.sessionData.count().catch(() => 0);

    return NextResponse.json({
      success: true,
      deletedCount,
      remainingCount,
      message: `Berhasil menghapus ${deletedCount} sesi`,
    });
  } catch (error) {
    console.error('Delete sessions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus data sesi' },
      { status: 500 }
    );
  }
}

