import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import DownloadClientPage from './DownloadClientPage';

// Pastikan halaman ini dinamis karena membaca data dari database
export const dynamic = 'force-dynamic';

interface SessionRecord {
  id: string;
  pngPath: string;
  gifPath: string;
  photo1Path?: string | null;
  photo2Path?: string | null;
  photo3Path?: string | null;
  createdAt: Date;
}

export default async function DownloadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session: SessionRecord | null = null;
  let hasDbError = false;

  try {
    const foundSession = await db.sessionData.findUnique({
      where: { id },
    });

    if (foundSession) {
      session = foundSession as SessionRecord;
    }

    // Jika Prisma client belum me-reload kolom baru, ambil langsung via raw query
    if (!session || (session && session.photo1Path === undefined)) {
      const rawRows = await db.$queryRawUnsafe<SessionRecord[]>(
        'SELECT id, pngPath, gifPath, photo1Path, photo2Path, photo3Path, createdAt FROM SessionData WHERE id = ? LIMIT 1',
        id
      );
      if (rawRows && rawRows.length > 0) {
        session = rawRows[0];
      }
    }
  } catch (error) {
    console.error("Database query error, trying raw query fallback:", error);
    try {
      const rawRows = await db.$queryRawUnsafe<SessionRecord[]>(
        'SELECT id, pngPath, gifPath, photo1Path, photo2Path, photo3Path, createdAt FROM SessionData WHERE id = ? LIMIT 1',
        id
      );
      if (rawRows && rawRows.length > 0) {
        session = rawRows[0];
      } else {
        hasDbError = true;
      }
    } catch (rawError) {
      console.error("Database fatal error:", rawError);
      hasDbError = true;
    }
  }

  if (hasDbError) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500 font-bold">Terjadi kesalahan pada server database.</p>
      </div>
    );
  }

  if (!session) {
    return notFound();
  }

  return (
    <DownloadClientPage 
      pngPath={session.pngPath} 
      gifPath={session.gifPath} 
      photo1Path={session.photo1Path ?? undefined}
      photo2Path={session.photo2Path ?? undefined}
      photo3Path={session.photo3Path ?? undefined}
      createdAt={session.createdAt ? new Date(session.createdAt) : new Date()} 
    />
  );
}
