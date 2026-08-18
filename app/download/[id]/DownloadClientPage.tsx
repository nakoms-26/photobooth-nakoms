'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Share2, ImageIcon, Film, Camera, RefreshCw, Sparkles } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface SessionDataPayload {
  id: string;
  pngPath: string;
  gifPath?: string | null;
  photo1Path?: string | null;
  photo2Path?: string | null;
  photo3Path?: string | null;
  createdAt: string;
}

interface DownloadClientPageProps {
  id: string;
  initialSession: SessionDataPayload | null;
}

export default function DownloadClientPage({ id, initialSession }: DownloadClientPageProps) {
  const [session, setSession] = useState<SessionDataPayload | null>(initialSession);
  // Use a ref to control polling so we don't re-trigger the effect when stopping
  // TODO: Re-enable polling setelah GIF pipeline aktif kembali
  const shouldPollRef = useRef<boolean>(false);


  useEffect(() => {
    if (!shouldPollRef.current) return;

    let isMounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/session/${id}`);
        if (res.ok) {
          const result = await res.json();
          if (result.found && result.data && isMounted) {
            setSession(result.data);
            const isGifReady = result.data.gifPath && result.data.gifPath !== 'PENDING';
            if (isGifReady) {
              shouldPollRef.current = false;
              return; // Stop polling — GIF is ready
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      if (isMounted && shouldPollRef.current) {
        timer = setTimeout(checkStatus, 2000);
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [id]); // Only id as dep — polling controlled by ref internally


  const handleDownload = async (url: string, filenamePrefix: string, extension: string = 'png') => {
    soundFx.playClickSound();
    const filename = `${filenamePrefix}-${Date.now()}.${extension}`;

    // 1. If base64 data url
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 2. Try client-side fetch -> blob download
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
        return;
      }
    } catch {
      // CORS fallback to proxy
    }

    // 3. Server-side attachment proxy directly triggers browser native download dialog
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    soundFx.playClickSound();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Medkom Box Photobooth',
          text: 'Lihat hasil fotoku di Medkom Box Photobooth!',
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link tersalin ke clipboard!");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="neo-box bg-white p-8 rounded-2xl max-w-sm w-full flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
          <h2 className="font-chillax font-black text-xl text-[var(--color-primary)]">
            Menyiapkan Foto Kamu...
          </h2>
          <p className="text-xs font-semibold text-gray-600 leading-relaxed">
            Foto sedang disinkronkan dari photobooth. Halaman ini akan otomatis diperbarui dalam hitungan detik!
          </p>
        </div>
      </div>
    );
  }

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date(session.createdAt || Date.now()));

  const rawPhotos = [
    { title: 'Foto Mentah #1', url: session.photo1Path, prefix: 'medkombox-raw-1' },
    { title: 'Foto Mentah #2', url: session.photo2Path, prefix: 'medkombox-raw-2' },
    { title: 'Foto Mentah #3', url: session.photo3Path, prefix: 'medkombox-raw-3' },
  ].filter((p): p is { title: string; url: string; prefix: string } => Boolean(p.url));


  const isGifReady = session.gifPath && session.gifPath !== 'PENDING';

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] py-8 px-4 font-sans">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="font-chillax font-black text-3xl md:text-4xl text-[var(--color-primary)]">
            Medkom Box Photobooth
          </h1>
          <p className="text-sm md:text-base font-semibold text-[var(--color-text-secondary)]">
            {formattedDate}
          </p>
          <div className="inline-flex self-center items-center gap-1.5 px-3 py-1 bg-yellow-300 text-black border-2 border-black rounded-full font-chillax font-bold text-xs shadow-[2px_2px_0_#000]">
            <Sparkles className="w-3.5 h-3.5" />
            5 File Siap Didownload
          </div>
        </div>

        {/* 1. Photo Strip Card */}
        <div className="neo-box bg-white p-4 md:p-6 rounded-2xl flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between border-b-2 border-gray-200 pb-3">
            <h2 className="font-chillax font-bold text-lg text-black flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[var(--color-primary)]" />
              1. Photo Strip (Frame PNG)
            </h2>
            <span className="text-[10px] bg-purple-100 text-[#8e36ff] px-2 py-1 rounded font-bold uppercase tracking-wider border border-purple-200">
              High Res
            </span>
          </div>
          
          <div className="w-full max-w-[280px] bg-gray-50 border-2 border-gray-200 rounded-xl p-2 overflow-hidden shadow-sm">
            <img 
              src={session.pngPath} 
              alt="Photo Strip" 
              className="w-full h-auto rounded-lg"
            />
          </div>

          <button
            onClick={() => handleDownload(session.pngPath, 'medkombox-strip', 'png')}
            className="w-full neo-btn-primary py-4 font-chillax font-bold text-base flex items-center justify-center gap-2 mt-2"
          >
            <Download className="w-5 h-5" />
            Download Photo Strip
          </button>
        </div>

        {/* 2. Animated GIF Card */}
        <div className="neo-box bg-white p-4 md:p-6 rounded-2xl flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between border-b-2 border-gray-200 pb-3">
            <h2 className="font-chillax font-bold text-lg text-black flex items-center gap-2">
              <Film className="w-5 h-5 text-[var(--color-primary)]" />
              2. Animasi Boomerang (GIF)
            </h2>
            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold uppercase tracking-wider border border-yellow-200">
              Loop GIF
            </span>
          </div>
          
          {isGifReady ? (
            <>
              <div className="w-full max-w-[320px] bg-gray-50 border-2 border-gray-200 rounded-xl p-2 overflow-hidden shadow-sm">
                <img 
                  src={session.gifPath!} 
                  alt="Animated GIF" 
                  className="w-full h-auto rounded-lg"
                />
              </div>

              <button
                onClick={() => handleDownload(session.gifPath!, 'medkombox-anim', 'gif')}
                className="w-full neo-btn-yellow py-4 font-chillax font-bold text-base flex items-center justify-center gap-2 mt-2"
              >
                <Download className="w-5 h-5" />
                Download Video GIF
              </button>
            </>
          ) : (
            <div className="w-full min-h-[160px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold font-chillax text-gray-800">
                  Menyinkronkan Animasi GIF...
                </span>
                <span className="text-xs text-gray-500 font-semibold">
                  Animasi akan otomatis muncul di sini begitu siap
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3, 4, 5. Raw Photos Section */}
        {rawPhotos.length > 0 && (
          <div className="neo-box bg-white p-4 md:p-6 rounded-2xl flex flex-col gap-4">
            <div className="w-full flex items-center justify-between border-b-2 border-gray-200 pb-3">
              <h2 className="font-chillax font-bold text-lg text-black flex items-center gap-2">
                <Camera className="w-5 h-5 text-[var(--color-primary)]" />
                3 Foto Mentahan (Original)
              </h2>
              <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded font-bold uppercase tracking-wider border border-green-200">
                Raw Shots
              </span>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              Foto asli tanpa frame beresolusi tinggi langsung dari kamera:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {rawPhotos.map((photo, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 bg-gray-50 p-2.5 rounded-xl border-2 border-gray-200 shadow-sm">
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                    <img 
                      src={photo.url} 
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-chillax font-bold text-xs text-black">
                    Foto #{idx + 1}
                  </span>
                  <button
                    onClick={() => handleDownload(photo.url!, photo.prefix)}
                    className="w-full py-2 px-3 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg border border-black shadow-[2px_2px_0_#000] flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download #{idx + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full neo-box bg-white py-4 font-chillax font-bold text-black text-base flex items-center justify-center gap-2 transition-transform hover:-translate-y-1 active:translate-y-0"
        >
          <Share2 className="w-5 h-5" />
          Bagikan Link Ini
        </button>

      </div>
    </div>
  );
}


