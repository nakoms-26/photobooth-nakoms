import { Metadata } from 'next';
import { db } from '@/lib/db';
import AdminDashboardClient, { AdminSessionItem, AdminStats } from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Gallery & Statistics - Medkom Box',
  description: 'Internal admin panel for photobooth gallery links and generation statistics',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  let sessions: AdminSessionItem[] = [];
  let totalCount = 0;
  let todayCount = 0;
  let gifCount = 0;

  try {
    totalCount = await db.sessionData.count();

    const records = await db.sessionData.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // Load initial 200 sessions
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
  } catch (err) {
    console.warn('Admin page Prisma query error, trying raw query fallback:', err);
    try {
      const countRes = await db.$queryRawUnsafe<Array<{ count: bigint | number }>>(
        'SELECT COUNT(*) as count FROM SessionData'
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
        'SELECT id, pngPath, gifPath, photo1Path, photo2Path, photo3Path, createdAt FROM SessionData ORDER BY createdAt DESC LIMIT 200'
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
    } catch (rawErr) {
      console.error('Fatal raw fallback in admin page:', rawErr);
    }
  }

  const initialStats: AdminStats = {
    totalSessions: totalCount,
    todaySessions: todayCount,
    gifGenerated: gifCount,
    estimatedTotalFiles: totalCount * 5,
  };

  return (
    <AdminDashboardClient
      initialSessions={sessions}
      initialStats={initialStats}
    />
  );
}
