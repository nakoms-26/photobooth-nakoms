'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Download, Film, Share2, Sparkles, RotateCcw, Check, RefreshCw, Image as ImageIcon, Camera } from 'lucide-react';
import { createAnimatedGif } from '@/lib/gifGenerator';
import { soundFx } from '@/lib/soundEffects';
import { QRCodeSVG } from 'qrcode.react';
import { uploadSession } from '@/lib/uploadApi';

interface DownloadStudioProps {
  pngDataUrl: string;
  capturedPhotos: string[];
  onResetSession: () => void;
}

export default function DownloadStudio({ pngDataUrl, capturedPhotos, onResetSession }: DownloadStudioProps) {
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isGeneratingGif, setIsGeneratingGif] = useState<boolean>(true);
  const [gifError, setGifError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [isUploading, setIsUploading] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Helper to load image and extract true aspect ratio
  const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || 640, height: img.naturalHeight || 480 });
      img.onerror = () => resolve({ width: 640, height: 480 });
      img.src = src;
    });
  };

  // Trigger celebration confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8e36ff', '#f8d22a', '#f28df8', '#c9a8ff'],
    });

    // Generate Animated GIF asynchronously keeping natural aspect ratio
    let isMounted = true;
    const generateGif = async () => {
      setIsGeneratingGif(true);
      
      // Calculate true aspect ratio from first captured photo
      const dims = await getImageDimensions(capturedPhotos[0]);
      const targetWidth = 480;
      const targetHeight = Math.round(targetWidth * (dims.height / dims.width));

      const res = await createAnimatedGif(capturedPhotos, 0.45, targetWidth, targetHeight);
      if (isMounted) {
        if (res.success && res.gifUrl) {
          setGifUrl(res.gifUrl);
          
          // Upload Both PNG, GIF, and 3 Raw Photos in one request
          setIsUploading(true);
          uploadSession(pngDataUrl, res.gifUrl, capturedPhotos).then((id) => {
            if (isMounted && id) {
              setSessionId(id);
            }
            if (isMounted) setIsUploading(false);
          });
        } else {
          setGifError(res.error || 'Gagal merender GIF');
          setIsUploading(false);
        }
        setIsGeneratingGif(false);
      }
    };

    if (capturedPhotos.length > 0) {
      generateGif();
    }

    return () => {
      isMounted = false;
    };
  }, [capturedPhotos, pngDataUrl]);

  const handleDownloadPng = () => {
    soundFx.playClickSound();
    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = `medkombox-strip-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadGif = () => {
    if (!gifUrl) return;
    soundFx.playClickSound();
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `medkombox-animation-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadRawPhoto = (src: string, index: number) => {
    soundFx.playClickSound();
    const a = document.createElement('a');
    a.href = src;
    a.download = `medkombox-raw-photo-${index + 1}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllRaw = () => {
    capturedPhotos.forEach((photo, idx) => {
      setTimeout(() => {
        handleDownloadRawPhoto(photo, idx);
      }, idx * 250);
    });
  };

  const handleCopyLink = () => {
    soundFx.playClickSound();
    const url = sessionId 
      ? `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/download/${sessionId}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl flex flex-col items-center justify-center gap-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="neo-box-yellow p-4 w-full text-center flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-2xl font-extrabold font-chillax text-white">
          <Sparkles className="w-6 h-6 text-[#f8d22a] animate-spin" />
          YAY! SESI FOTO SELESAI!
          <Sparkles className="w-6 h-6 text-[#f8d22a] animate-spin" />
        </div>
        <p className="text-xs font-bold text-white/90">
          Foto kamu telah berhasil digabungkan dalam frame PNG, animasi GIF, & 3 foto mentahan!
        </p>
      </div>

      {/* ENLARGED QR CODE CARD (TOP PRIORITY FOR SCANNING) */}
      <div className="neo-box w-full bg-white p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-black shadow-[6px_6px_0_#000]">
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-300 border-2 border-black rounded-full font-chillax font-black text-xs">
            <Sparkles className="w-4 h-4 text-black" />
            SCAN INSTAN DARI HP
          </div>
          <h3 className="font-chillax font-black text-2xl md:text-3xl text-[var(--color-primary)]">
            SCAN UNTUK DOWNLOAD!
          </h3>
          <p className="text-sm font-semibold text-[var(--color-text-secondary)] leading-relaxed">
            Arahkan kamera HP ke QR Code di samping untuk membuka halaman download dan menyimpan ke-5 file foto & video GIF kamu secara instan!
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Tersedia: 1 Strip PNG + 1 Boomerang GIF + 3 Foto Mentahan
          </div>
        </div>
        
        {/* Large QR Container */}
        <div className="flex-shrink-0 bg-white border-4 border-black p-4 rounded-2xl shadow-[6px_6px_0_#000] flex flex-col items-center justify-center">
          {isUploading || isGeneratingGif ? (
            <div className="w-[190px] h-[190px] flex flex-col items-center justify-center gap-3 bg-gray-50 rounded-xl">
              <RefreshCw className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
              <span className="text-xs font-bold text-gray-600 font-chillax">Membuat QR...</span>
            </div>
          ) : sessionId ? (
            <div className="flex flex-col items-center gap-2">
              <QRCodeSVG 
                value={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/download/${sessionId}`} 
                size={190}
                level="M"
                includeMargin={false}
              />
              <span className="text-[10px] font-bold text-gray-500 font-chillax tracking-wider uppercase">
                Medkom Box Mobile
              </span>
            </div>
          ) : (
            <div className="w-[190px] h-[190px] flex flex-col items-center justify-center gap-2 bg-red-50 rounded-xl text-red-600 p-3 text-center">
              <span className="text-xs font-bold font-chillax">Gagal membuat link QR</span>
            </div>
          )}
        </div>
      </div>

      {/* Dual Preview Cards (PNG Strip + Animated GIF) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* 1. PNG Photo Strip Card */}
        <div className="neo-box rounded-2xl p-4 bg-[#ffffff] flex flex-col items-center gap-3">
          <div className="w-full flex items-center justify-between border-b-2 border-[#202030] pb-2">
            <span className="text-xs font-extrabold uppercase text-[#8e36ff] font-chillax flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              1. PHOTO STRIP (FRAME PNG)
            </span>
            <span className="text-[10px] bg-[#faf8ff] text-[#8e36ff] px-2 py-0.5 rounded-md font-bold border border-[#202030]">
              HIGH RES
            </span>
          </div>

          <div className="max-h-[380px] overflow-y-auto border-2 border-[#202030] rounded-xl p-1 bg-[#faf8ff]">
            <img
              src={pngDataUrl}
              alt="Hasil Photo Strip PNG"
              className="w-[200px] h-auto rounded-lg shadow-md mx-auto"
            />
          </div>

          <button
            onClick={handleDownloadPng}
            className="w-full neo-btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 font-chillax mt-2"
          >
            <Download className="w-4 h-4" />
            DOWNLOAD PNG STRIP
          </button>
        </div>

        {/* 2. Animated GIF Boomerang Card */}
        <div className="neo-box rounded-2xl p-4 bg-[#ffffff] flex flex-col items-center gap-3">
          <div className="w-full flex items-center justify-between border-b-2 border-[#202030] pb-2">
            <span className="text-xs font-extrabold uppercase text-[#8e36ff] font-chillax flex items-center gap-1">
              <Film className="w-4 h-4" />
              2. ANIMATED GIF (LOOP)
            </span>
            <span className="text-[10px] bg-[#faf8ff] text-[#8e36ff] px-2 py-0.5 rounded-md font-bold border border-[#202030]">
              BOOMERANG
            </span>
          </div>

          <div className="w-full min-h-[250px] max-h-[380px] rounded-xl border-2 border-[#202030] bg-[#faf8ff] flex items-center justify-center overflow-hidden relative p-2">
            {isGeneratingGif ? (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <RefreshCw className="w-8 h-8 text-[#8e36ff] animate-spin" />
                <span className="text-xs font-bold font-chillax text-[#8e36ff]">
                  Memproses Animasi GIF...
                </span>
              </div>
            ) : gifUrl ? (
              <img
                src={gifUrl}
                alt="Animated Photobooth GIF"
                className="max-h-[360px] w-auto h-auto object-contain rounded-lg shadow-md mx-auto"
              />
            ) : (
              <span className="text-xs text-[#ef4444] font-bold p-4 text-center">
                {gifError || 'GIF tidak dapat dibuat'}
              </span>
            )}
          </div>

          <button
            onClick={handleDownloadGif}
            disabled={!gifUrl || isGeneratingGif}
            className="w-full neo-btn-yellow py-3 text-sm font-bold flex items-center justify-center gap-2 font-chillax disabled:opacity-50 mt-2"
          >
            <Film className="w-4 h-4" />
            DOWNLOAD GIF ANIMATED
          </button>
        </div>
      </div>

      {/* 3, 4, 5. RAW PHOTOS EXPORT SECTION */}
      {capturedPhotos.length > 0 && (
        <div className="neo-box w-full bg-white p-5 rounded-2xl flex flex-col gap-4">
          <div className="w-full flex items-center justify-between border-b-2 border-[#202030] pb-2">
            <span className="text-xs font-extrabold uppercase text-[#8e36ff] font-chillax flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[var(--color-primary)]" />
              3, 4, 5. FOTO ASLI / MENTAHAN (RAW SHOTS)
            </span>
            <button
              onClick={handleDownloadAllRaw}
              className="text-[10px] bg-yellow-300 hover:bg-yellow-400 text-black px-2.5 py-1 rounded-md font-bold border border-black shadow-[2px_2px_0_#000] flex items-center gap-1 transition-all active:translate-y-0.5 active:shadow-none"
            >
              <Download className="w-3 h-3" />
              DOWNLOAD 3 FOTO SEKALIGUS
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {capturedPhotos.map((photo, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center gap-2 bg-[#faf8ff] p-2.5 rounded-xl border-2 border-[#202030]"
              >
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-black/20 bg-black/5">
                  <img 
                    src={photo} 
                    alt={`Foto Mentahan #${idx + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-full flex items-center justify-between px-1">
                  <span className="font-chillax font-bold text-xs text-black">
                    Foto #{idx + 1}
                  </span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase">
                    Raw Shot
                  </span>
                </div>
                <button
                  onClick={() => handleDownloadRawPhoto(photo, idx)}
                  className="w-full py-2 px-3 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg border border-black shadow-[2px_2px_0_#000] flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none font-chillax transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD #{idx + 1}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleCopyLink}
          className="w-full neo-btn py-3 bg-[#f28df8] text-[#202030] text-xs font-bold flex items-center justify-center gap-1.5 font-chillax"
        >
          {copied ? <Check className="w-4 h-4 text-[#8e36ff]" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'LINK DOWNLOAD TERSALIN!' : 'SALIN LINK DOWNLOAD'}
        </button>

        <button
          onClick={() => {
            soundFx.playClickSound();
            onResetSession();
          }}
          className="w-full neo-btn-yellow py-3 text-xs font-bold flex items-center justify-center gap-1.5 font-chillax"
        >
          <RotateCcw className="w-4 h-4" />
          FOTO LAGI / SESI BARU
        </button>
      </div>

    </div>
  );
}

