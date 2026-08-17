'use client';

import React from 'react';
import { Download, Share2, ImageIcon, Film } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface DownloadClientPageProps {
  pngPath: string;
  gifPath: string;
  createdAt: Date;
}

export default function DownloadClientPage({ pngPath, gifPath, createdAt }: DownloadClientPageProps) {
  const handleDownload = (url: string, filename: string) => {
    soundFx.playClickSound();
    const a = document.createElement('a');
    a.href = url;
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
          title: 'Snapkoms Photobooth',
          text: 'Lihat hasil fotoku di Snapkoms Photobooth!',
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

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date(createdAt));

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] py-8 px-4 font-sans">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="font-chillax font-black text-3xl md:text-4xl text-[var(--color-primary)]">
            Snapkoms Photobooth
          </h1>
          <p className="text-sm md:text-base font-semibold text-[var(--color-text-secondary)]">
            {formattedDate}
          </p>
        </div>

        {/* Photo Strip Card */}
        <div className="neo-box bg-white p-4 md:p-6 rounded-2xl flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between border-b-2 border-gray-200 pb-3">
            <h2 className="font-chillax font-bold text-lg text-black flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[var(--color-primary)]" />
              Photo Strip
            </h2>
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold uppercase tracking-wider">
              High Res PNG
            </span>
          </div>
          
          <div className="w-full max-w-[280px] bg-gray-50 border-2 border-gray-200 rounded-xl p-2 overflow-hidden shadow-sm">
            <img 
              src={pngPath} 
              alt="Photo Strip" 
              className="w-full h-auto rounded-lg"
            />
          </div>

          <button
            onClick={() => handleDownload(pngPath, `snapkoms-photo-${Date.now()}.png`)}
            className="w-full neo-btn-primary py-4 font-chillax font-bold text-base flex items-center justify-center gap-2 mt-2"
          >
            <Download className="w-5 h-5" />
            Download Foto
          </button>
        </div>

        {/* Animated GIF Card */}
        <div className="neo-box bg-white p-4 md:p-6 rounded-2xl flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between border-b-2 border-gray-200 pb-3">
            <h2 className="font-chillax font-bold text-lg text-black flex items-center gap-2">
              <Film className="w-5 h-5 text-[var(--color-primary)]" />
              Animasi Boomerang
            </h2>
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold uppercase tracking-wider">
              Loop GIF
            </span>
          </div>
          
          <div className="w-full max-w-[320px] bg-gray-50 border-2 border-gray-200 rounded-xl p-2 overflow-hidden shadow-sm">
            <img 
              src={gifPath} 
              alt="Animated GIF" 
              className="w-full h-auto rounded-lg"
            />
          </div>

          <button
            onClick={() => handleDownload(gifPath, `snapkoms-anim-${Date.now()}.gif`)}
            className="w-full neo-btn-yellow py-4 font-chillax font-bold text-base flex items-center justify-center gap-2 mt-2"
          >
            <Download className="w-5 h-5" />
            Download Video GIF
          </button>
        </div>

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
