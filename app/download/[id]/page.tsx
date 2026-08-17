import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import DownloadClientPage from './DownloadClientPage';

// Pastikan halaman ini dinamis karena membaca data dari database
export const dynamic = 'force-dynamic';

export default async function DownloadPage({ params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const session = await db.sessionData.findUnique({
      where: { id },
    });

    if (!session) {
      return notFound();
    }

    return <DownloadClientPage pngPath={session.pngPath} gifPath={session.gifPath} createdAt={session.createdAt} />;
  } catch (error) {
    console.error("Database error:", error);
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500 font-bold">Terjadi kesalahan pada server database.</p>
      </div>
    );
  }
}
