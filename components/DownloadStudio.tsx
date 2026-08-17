'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Download, Film, Share2, Sparkles, RotateCcw, Check, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { createAnimatedGif } from '@/lib/gifGenerator';
import { soundFx } from '@/lib/soundEffects';
import { QRCodeSVG } from 'qrcode.react';
import { uploadAsset } from '@/lib/uploadApi';

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
  const [pngUploadUrl, setPngUploadUrl] = useState<string | null>(null);
  const [gifUploadUrl, setGifUploadUrl] = useState<string | null>(null);
  const [isUploadingPng, setIsUploadingPng] = useState<boolean>(true);
  const [isUploadingGif, setIsUploadingGif] = useState<boolean>(false);

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
          // Upload GIF in background
          setIsUploadingGif(true);
          uploadAsset(res.gifUrl, 'gif').then((url) => {
            if (isMounted && url) {
              setGifUploadUrl(url);
            }
            if (isMounted) setIsUploadingGif(false);
          });
        } else {
          setGifError(res.error || 'Gagal merender GIF');
        }
        setIsGeneratingGif(false);
      }
    };

    if (capturedPhotos.length > 0) {
      generateGif();
    }
    
    // Upload PNG in background
    setIsUploadingPng(true);
    uploadAsset(pngDataUrl, 'png').then((url) => {
      if (isMounted && url) {
        setPngUploadUrl(url);
      }
      if (isMounted) setIsUploadingPng(false);
    });

    return () => {
      isMounted = false;
    };
  }, [capturedPhotos, pngDataUrl]);

  const handleDownloadPng = () => {
    soundFx.playClickSound();
    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = `snapkoms-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadGif = () => {
    if (!gifUrl) return;
    soundFx.playClickSound();
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `snapkoms-animation-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    soundFx.playClickSound();
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl flex flex-col items-center justify-center gap-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="neo-box-yellow p-4 w-full text-center flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-2xl font-extrabold font-chillax text-white">
          <Sparkles className="w-6 h-6 text-[#f8d22a] animate-spin" />
          YAY! SESI FOTO SELESAI!
          <Sparkles className="w-6 h-6 text-[#f8d22a] animate-spin" />
        </div>
        <p className="text-xs font-bold text-white/90">
          Foto kamu telah berhasil digabungkan dalam frame PNG & animasi GIF!
        </p>
      </div>

      {/* Dual Preview Cards (PNG Strip + Animated GIF) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* PNG Photo Strip Card */}
        <div className="neo-box rounded-2xl p-4 bg-[#ffffff] flex flex-col items-center gap-3">
          <div className="w-full flex items-center justify-between border-b-2 border-[#202030] pb-2">
            <span className="text-xs font-extrabold uppercase text-[#8e36ff] font-chillax flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              PHOTO STRIP (PNG)
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
            className="w-full neo-btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 font-chillax"
          >
            <Download className="w-4 h-4" />
            DOWNLOAD PNG STRIP
          </button>

          {isUploadingPng ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 text-[#8e36ff]">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold font-chillax">Menyiapkan QR Code...</span>
            </div>
          ) : pngUploadUrl ? (
            <div className="w-full mt-2 flex flex-col items-center gap-2 border-t-2 border-[#202030] pt-12">
              <span className="text-[10px] font-bold text-[#5c5c68]">SCAN UNTUK DOWNLOAD DI HP</span>
              <div className="p-2 bg-white border-2 border-[#202030] rounded-lg shadow-sm">
                <QRCodeSVG value={pngUploadUrl} size={90} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Animated GIF Boomerang Card */}
        <div className="neo-box rounded-2xl p-4 bg-[#ffffff] flex flex-col items-center gap-3">
          <div className="w-full flex items-center justify-between border-b-2 border-[#202030] pb-2">
            <span className="text-xs font-extrabold uppercase text-[#8e36ff] font-chillax flex items-center gap-1">
              <Film className="w-4 h-4" />
              ANIMATED GIF (LOOP)
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
            className="w-full neo-btn-yellow py-3 text-sm font-bold flex items-center justify-center gap-2 font-chillax disabled:opacity-50"
          >
            <Film className="w-4 h-4" />
            DOWNLOAD GIF ANIMATED
          </button>

          {isUploadingGif ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 text-[#8e36ff]">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold font-chillax">Menyiapkan QR Code...</span>
            </div>
          ) : gifUploadUrl ? (
            <div className="w-full mt-2 flex flex-col items-center gap-2 border-t-2 border-[#202030] pt-12">
              <span className="text-[10px] font-bold text-[#5c5c68]">SCAN UNTUK DOWNLOAD DI HP</span>
              <div className="p-2 bg-white border-2 border-[#202030] rounded-lg shadow-sm">
                <QRCodeSVG value={gifUploadUrl} size={90} />
              </div>
            </div>
          ) : null}
        </div>

      </div>

      {/* Action Buttons Row */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleCopyLink}
          className="w-full neo-btn py-3 bg-[#f28df8] text-[#202030] text-xs font-bold flex items-center justify-center gap-1.5 font-chillax"
        >
          {copied ? <Check className="w-4 h-4 text-[#8e36ff]" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'LINK TERSALIN!' : 'BAGIKAN BOOTH INI'}
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
