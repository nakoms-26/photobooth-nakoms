'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, FlipHorizontal, AlertCircle, RotateCcw, ArrowRight, Check, Upload } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface CameraViewProps {
  onPhotosCaptured: (capturedImages: string[], photoCount: number) => void;
}

type CapturePhase = 'READY' | 'COUNTDOWN' | 'REVIEW' | 'REVIEW_ALL';

const FILTERS = [
  { id: 'none', label: 'ORIGINAL', css: 'none' },
  { id: 'dark_room', label: 'DARK ROOM', css: 'contrast(1.15) brightness(0.9) saturate(1.1) sepia(0.1)' },
  { id: 'retro', label: 'RETRO', css: 'sepia(0.4) contrast(1.1) brightness(1.1) saturate(1.2)' },
  { id: 'film', label: 'FILM', css: 'contrast(1.2) saturate(0.9) sepia(0.2) hue-rotate(-10deg)' },
  { id: 'flash', label: 'FLASH', css: 'brightness(1.2) contrast(1.1) saturate(1.1)' },
  { id: 'sun_kissed', label: 'SUN KISSED', css: 'sepia(0.3) saturate(1.3) hue-rotate(-15deg) brightness(1.05)' },
  { id: 'autumn', label: 'AUTUMN', css: 'sepia(0.4) saturate(1.4) hue-rotate(-20deg) brightness(0.95)' },
  { id: 'noir', label: 'NOIR', css: 'grayscale(1) contrast(1.2) brightness(0.95)' },
  { id: 'lomo', label: 'LOMO', css: 'contrast(1.3) saturate(1.4) brightness(0.9)' },
];

export default function CameraView({ onPhotosCaptured }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);

  // Settings
  const [targetPhotoCount, setTargetPhotoCount] = useState<3 | 4>(4);

  // Capture State
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [capturePhase, setCapturePhase] = useState<CapturePhase>('READY');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState<number>(0);
  const [showFlash, setShowFlash] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  // Filter State
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [filterThumbnail, setFilterThumbnail] = useState<string | null>(null);

  // Initialize Camera Stream
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = mediaStream;
      setCameraError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setCameraError('Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses webcam di browser.');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 0);
    return () => {
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  // Snap Single Photo from Video Element onto Hidden Canvas
  const captureCurrentFrame = useCallback((applyFilter = true) => {
    if (!videoRef.current) return null;
    const video = videoRef.current;

    let canvas = hiddenCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      hiddenCanvasRef.current = canvas;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    
    if (applyFilter) {
      const activeFilterCss = FILTERS.find(f => f.id === selectedFilter)?.css || 'none';
      ctx.filter = activeFilterCss;
    }

    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    return canvas.toDataURL('image/png', 0.95);
  }, [isMirrored, selectedFilter]);

  // Capture Thumbnail for Filters
  const handleVideoPlay = () => {
    if (!filterThumbnail) {
      setTimeout(() => {
        const thumb = captureCurrentFrame(false);
        if (thumb) setFilterThumbnail(thumb);
      }, 1000);
    }
  };

  // Start countdown for a single photo
  const startSingleCountdown = () => {
    setCapturePhase('COUNTDOWN');
    let count = 3;
    setCountdown(count);
    soundFx.playBeepSound();

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        soundFx.playBeepSound();
      } else {
        clearInterval(timer);
        setCountdown(null);

        // Trigger Flash & Camera Shutter
        setShowFlash(true);
        soundFx.playShutterSound();
        soundFx.playFlashBeep();

        setTimeout(() => setShowFlash(false), 300);

        // Take snapshot
        const frameData = captureCurrentFrame(true);
        if (frameData) {
          setLastCapturedPhoto(frameData);
          setCapturePhase('REVIEW');
        } else {
          setCapturePhase('READY');
        }
      }
    }, 1000);
  };

  // Accept the current photo and move on
  const handleAcceptPhoto = () => {
    if (!lastCapturedPhoto) return;
    soundFx.playClickSound();

    if (retakeIndex !== null) {
      // Replacing a specific photo during REVIEW_ALL retake
      const updated = [...capturedPhotos];
      updated[retakeIndex] = lastCapturedPhoto;
      setCapturedPhotos(updated);
      setRetakeIndex(null);
      setLastCapturedPhoto(null);
      setCapturePhase('REVIEW_ALL');
    } else {
      // Adding a new photo
      const updatedPhotos = [...capturedPhotos, lastCapturedPhoto];
      setCapturedPhotos(updatedPhotos);
      setLastCapturedPhoto(null);

      if (updatedPhotos.length >= targetPhotoCount) {
        soundFx.playSuccessCheer();
        setCapturePhase('REVIEW_ALL');
      } else {
        setCurrentPoseIndex(updatedPhotos.length);
        setCapturePhase('READY');
      }
    }
  };

  // Retake the current photo
  const handleRetakePhoto = () => {
    soundFx.playClickSound();
    setLastCapturedPhoto(null);
    setCapturePhase('READY');
  };

  // Retake a specific photo from grid
  const handleRetakeFromGrid = (index: number) => {
    soundFx.playClickSound();
    setRetakeIndex(index);
    setCurrentPoseIndex(index);
    setLastCapturedPhoto(null);
    setCapturePhase('READY');
  };

  const handleConfirmAll = () => {
    soundFx.playSuccessCheer();
    onPhotosCaptured(capturedPhotos, targetPhotoCount);
  };

  return (
    <div className="w-full h-[100dvh] flex items-center justify-center p-4 lg:p-6 font-sans relative bg-grid overflow-hidden">
       <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center justify-center w-full max-w-full h-full mx-auto z-10">
          
          {/* LEFT PANEL: Camera & Controls */}
          <div className="flex-1 w-full h-full flex flex-col items-center justify-center gap-4 min-h-0">
             
             {/* Camera Frame */}
             <div className="relative w-full max-w-4xl aspect-video neo-box p-3 bg-surface min-h-0 shrink">
                <div className="relative w-full h-full rounded-[1.2rem] overflow-hidden bg-black flex items-center justify-center border-2 border-black">
                    
                    {cameraError ? (
                      <div className="p-6 text-center text-white flex flex-col items-center gap-3">
                        <AlertCircle className="w-12 h-12 text-error" />
                        <p className="font-bold text-sm text-error">{cameraError}</p>
                        <button onClick={startCamera} className="neo-btn px-4 py-2 text-xs mt-2">
                          Coba Lagi
                        </button>
                      </div>
                    ) : (
                      <video 
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onPlay={handleVideoPlay}
                        className={`w-full h-full object-cover transition-opacity ${capturePhase === 'REVIEW' && lastCapturedPhoto ? 'opacity-0' : 'opacity-100'} ${isMirrored ? 'scale-x-[-1]' : ''}`}
                        style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.css || 'none' }}
                      />
                    )}

                    {/* Review Overlay */}
                    {capturePhase === 'REVIEW' && lastCapturedPhoto && (
                      <div className="absolute inset-0 z-30">
                        <img src={lastCapturedPhoto} alt="Review" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Flash Effect Layer */}
                    {showFlash && (
                      <div className="absolute inset-0 bg-white z-40 animate-camera-flash pointer-events-none" />
                    )}
                    
                    {/* 3x3 Grid Overlay (Only when ready or countdown) */}
                    {(capturePhase === 'READY' || capturePhase === 'COUNTDOWN') && (
                      <>
                        <div className="absolute inset-0 pointer-events-none flex flex-col z-20">
                          <div className="flex-1 border-b border-white/40" />
                          <div className="flex-1 border-b border-white/40" />
                          <div className="flex-1" />
                        </div>
                        <div className="absolute inset-0 pointer-events-none flex z-20">
                          <div className="flex-1 border-r border-white/40" />
                          <div className="flex-1 border-r border-white/40" />
                          <div className="flex-1" />
                        </div>
                      </>
                    )}

                    {/* Countdown */}
                    {countdown !== null && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        <span className="text-[12rem] font-chillax font-black text-secondary drop-shadow-[6px_6px_0_var(--color-black)]">
                          {countdown}
                        </span>
                      </div>
                    )}
                </div>
             </div>

             {/* Capture Controls / Review Actions */}
             <div className="flex items-center justify-center gap-6 w-full h-20 shrink-0">
                {(capturePhase === 'READY' || capturePhase === 'COUNTDOWN' || capturePhase === 'REVIEW_ALL') ? (
                  <>
                    <button 
                      onClick={() => setTargetPhotoCount(targetPhotoCount === 4 ? 3 : 4)}
                      className="w-14 h-14 bg-surface rounded-full flex flex-col items-center justify-center border-2 border-black text-primary shadow-[0_4px_0_var(--color-black)] hover:translate-y-[2px] hover:shadow-[0_2px_0_var(--color-black)] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
                      title="Ubah Jumlah Foto"
                    >
                      <span className="font-chillax font-bold text-sm leading-none">{targetPhotoCount}</span>
                      <span className="text-[10px] font-bold leading-none">Foto</span>
                    </button>

                    <button 
                      onClick={startSingleCountdown}
                      disabled={!!countdown || capturePhase === 'REVIEW_ALL'}
                      className="w-20 h-20 rounded-full border-[4px] border-black p-1.5 flex items-center justify-center cursor-pointer transition-transform disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 bg-surface shadow-[0_6px_0_var(--color-black)]"
                    >
                      <div className="w-full h-full rounded-full bg-primary" />
                    </button>

                    <button 
                      onClick={() => setIsMirrored(!isMirrored)}
                      disabled={!!countdown || capturePhase === 'REVIEW_ALL'}
                      className="w-14 h-14 bg-surface rounded-full flex items-center justify-center border-2 border-black text-primary shadow-[0_4px_0_var(--color-black)] hover:translate-y-[2px] hover:shadow-[0_2px_0_var(--color-black)] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
                      title="Flip Camera"
                    >
                      <FlipHorizontal className="w-6 h-6" />
                    </button>
                  </>
                ) : (
                  // Review Buttons
                  <div className="flex items-center gap-4 w-full max-w-sm">
                    <button
                      onClick={handleRetakePhoto}
                      className="neo-btn flex-1 py-3 font-chillax font-bold text-lg flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Ulangi
                    </button>
                    <button
                      onClick={handleAcceptPhoto}
                      className="neo-btn-primary flex-1 py-3 font-chillax font-bold text-lg flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      Simpan
                    </button>
                  </div>
                )}
             </div>

             {/* Filters Row */}
             <div className="w-full overflow-x-auto pb-2 pt-1 hide-scrollbar shrink-0">
               <div className="flex gap-4 px-2 w-max mx-auto">
                 {FILTERS.map(f => (
                   <div 
                     key={f.id} 
                     onClick={() => setSelectedFilter(f.id)}
                     className="flex flex-col items-center gap-2 cursor-pointer group"
                   >
                     <div 
                        className={`w-16 h-20 rounded-[1rem] overflow-hidden border-[3px] transition-all duration-200 bg-surface flex items-center justify-center ${selectedFilter === f.id ? 'border-primary p-0.5' : 'border-transparent'}`}
                     >
                       <div className="w-full h-full rounded-[0.75rem] overflow-hidden bg-gray-200 border border-black/10">
                         {filterThumbnail ? (
                           <img 
                             src={filterThumbnail} 
                             className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                             style={{ filter: f.css }}
                             alt={f.label}
                           />
                         ) : (
                           <div className="w-full h-full bg-gray-300 animate-pulse" />
                         )}
                       </div>
                     </div>
                     <span 
                        className={`text-[10px] font-chillax font-bold tracking-wider transition-colors ${selectedFilter === f.id ? 'text-primary' : 'text-text-muted group-hover:text-text'}`}
                     >
                       {f.label}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
          </div>

          {/* RIGHT PANEL: Captured Moments */}
          <div className="w-full lg:w-72 h-full max-h-full overflow-y-auto neo-box bg-surface p-4 flex flex-col items-center gap-4 shrink-0 hide-scrollbar">
             <div className="text-center shrink-0">
               <h3 className="font-chillax font-bold text-xl text-text border-b-2 border-black inline-block pb-1">Captured Moments</h3>
               <p className="font-bold text-base mt-1 text-primary">{capturedPhotos.length}/{targetPhotoCount}</p>
             </div>

             <div className="flex flex-row lg:flex-col gap-4 w-full justify-center shrink-0">
               {Array.from({ length: targetPhotoCount }).map((_, idx) => (
                 <div 
                   key={idx}
                   onClick={() => {
                     // Allow retake by clicking on the thumbnail if we are in REVIEW_ALL
                     if (capturePhase === 'REVIEW_ALL' && capturedPhotos[idx]) {
                       handleRetakeFromGrid(idx);
                     }
                   }}
                   className={`
                     relative aspect-video lg:w-full w-28 rounded-xl flex items-center justify-center overflow-hidden transition-all shrink-0
                     ${capturePhase === 'REVIEW_ALL' && capturedPhotos[idx] ? 'cursor-pointer hover:border-primary border-2 border-black shadow-[3px_3px_0_var(--color-black)] hover:translate-y-[-2px]' : ''}
                   `}
                   style={{
                     borderColor: idx === currentPoseIndex && !capturedPhotos[idx] ? 'var(--color-primary)' : (capturedPhotos[idx] ? 'var(--color-black)' : 'var(--color-border)'),
                     borderWidth: '2px',
                     borderStyle: capturedPhotos[idx] ? 'solid' : 'dashed',
                     backgroundColor: idx === currentPoseIndex && !capturedPhotos[idx] ? 'var(--color-gray-100)' : (capturedPhotos[idx] ? 'transparent' : 'var(--color-surface)')
                   }}
                 >
                   {capturedPhotos[idx] ? (
                     <img src={capturedPhotos[idx]} className="w-full h-full object-cover" />
                   ) : (
                     <span className="font-chillax font-bold text-xl text-text-muted opacity-50">{idx + 1}</span>
                   )}
                   
                   {/* Hover overlay for retake */}
                   {capturePhase === 'REVIEW_ALL' && capturedPhotos[idx] && (
                     <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                       <RotateCcw className="w-5 h-5 mb-1" />
                       <span className="text-[10px] font-bold font-chillax">Ulangi</span>
                     </div>
                   )}
                 </div>
               ))}
             </div>

             {/* Action Button at Bottom of Sidebar */}
             <div className="w-full mt-2 flex-1 flex flex-col justify-end shrink-0">
               {capturePhase === 'REVIEW_ALL' ? (
                  <button 
                    onClick={handleConfirmAll}
                    className="neo-btn-primary w-full py-3 font-chillax font-bold text-base flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Selesai
                  </button>
               ) : (
                  <div className="w-full py-3 border-2 border-dashed border-border text-text-muted rounded-xl font-chillax font-bold text-xs text-center flex items-center justify-center bg-surface">
                    Sedang Berfoto...
                  </div>
               )}
             </div>
          </div>

       </div>
    </div>
  );
}
