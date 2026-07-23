'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, FlipHorizontal, Sparkles, AlertCircle, RotateCcw, ArrowRight, Check } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface CameraViewProps {
  onPhotosCaptured: (capturedImages: string[], photoCount: number) => void;
}

type CapturePhase = 'READY' | 'COUNTDOWN' | 'REVIEW' | 'REVIEW_ALL';

export default function CameraView({ onPhotosCaptured }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
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

  // Initialize Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setCameraError('Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses webcam di browser.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Snap Single Photo from Video Element onto Hidden Canvas
  const captureCurrentFrame = useCallback(() => {
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
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    return canvas.toDataURL('image/png', 0.95);
  }, [isMirrored]);

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
        const frameData = captureCurrentFrame();
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
        // All photos captured
        soundFx.playSuccessCheer();
        setCapturePhase('REVIEW_ALL');
      } else {
        // More photos to take
        setCurrentPoseIndex(updatedPhotos.length);
        setCapturePhase('READY');
      }
    }
  };

  // Retake the current photo (discard and re-shoot)
  const handleRetakePhoto = () => {
    soundFx.playClickSound();
    setLastCapturedPhoto(null);
    setCapturePhase('READY');
  };

  // Retake a specific photo from REVIEW_ALL
  const handleRetakeFromGrid = (index: number) => {
    soundFx.playClickSound();
    setRetakeIndex(index);
    setCurrentPoseIndex(index);
    setLastCapturedPhoto(null);
    setCapturePhase('READY');
  };

  // Final confirmation — proceed to frame compositor
  const handleConfirmAll = () => {
    soundFx.playSuccessCheer();
    onPhotosCaptured(capturedPhotos, targetPhotoCount);
  };

  const effectivePoseNumber = retakeIndex !== null ? retakeIndex + 1 : currentPoseIndex + 1;

  return (
    <div className="w-full flex flex-col items-center gap-6 justify-center">

      {/* REVIEW ALL — Grid of all photos with retake option */}
      {capturePhase === 'REVIEW_ALL' ? (
        <div className="w-full max-w-2xl flex flex-col items-center gap-5 animate-fadeIn">
          <div className="neo-box-purple p-4 w-full text-center">
            <h2 className="text-xl font-bold font-chillax text-white">
              Semua Foto Selesai
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Periksa hasil foto. Klik foto yang ingin diulang, atau lanjutkan ke editor frame.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {capturedPhotos.map((photo, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="neo-box p-1 overflow-hidden w-full aspect-[3/4]">
                  <img
                    src={photo}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs font-bold text-[#5c5c68]">Foto {idx + 1}</span>
                  <button
                    onClick={() => handleRetakeFromGrid(idx)}
                    className="neo-btn px-2 py-1 text-[11px] font-bold flex items-center gap-1 ml-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Ulangi
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleConfirmAll}
            className="neo-btn-primary py-4 px-10 text-base font-bold flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Lanjutkan ke Editor Frame
          </button>
        </div>
      ) : (
        /* CAMERA VIEW — READY / COUNTDOWN / REVIEW */
        <>
          {/* Camera Live View Container — Larger frame */}
          <div className="relative w-full max-w-2xl aspect-[16/10] neo-box border-2 bg-[#1f1f27] overflow-hidden flex items-center justify-center shadow-[0_8px_0_#202030]">

            {/* Flash Effect Layer */}
            {showFlash && (
              <div className="absolute inset-0 bg-white z-40 animate-camera-flash pointer-events-none" />
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 bg-transparent flex flex-col items-center justify-center pointer-events-none">
                <span className="text-8xl font-black font-chillax text-[#f8d22a] drop-shadow-[3px_3px_0px_#202030] animate-bounce">
                  {countdown}
                </span>
              </div>
            )}

            {/* Review Overlay — Show last captured photo */}
            {capturePhase === 'REVIEW' && lastCapturedPhoto && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1f1f27]">
                <img
                  src={lastCapturedPhoto}
                  alt="Hasil foto"
                  className={`w-full h-full object-cover ${isMirrored ? '' : ''}`}
                />
              </div>
            )}

            {/* Video Stream Element */}
            {cameraError ? (
              <div className="p-6 text-center text-white flex flex-col items-center gap-3">
                <AlertCircle className="w-12 h-12 text-[#ef4444]" />
                <p className="font-bold text-sm text-red-300">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="neo-btn px-4 py-2 bg-[#f8d22a] text-[#202030] text-xs font-bold"
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''} ${capturePhase === 'REVIEW' ? 'invisible' : ''}`}
              />
            )}

            {/* Camera Live Badge */}
            {capturePhase !== 'REVIEW' && (
              <div className="absolute top-3 left-3 bg-[#8e36ff] text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-[#202030] shadow-[0_2px_0_#202030] flex items-center gap-1.5 z-20">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                LIVE
              </div>
            )}

            {/* Pose Counter Badge */}
            <div className="absolute top-3 right-14 bg-[#f8d22a] text-[#202030] text-xs font-bold px-3 py-1 rounded-full border-2 border-[#202030] shadow-[0_2px_0_#202030] z-20">
              {capturedPhotos.length + (capturePhase === 'REVIEW' ? 1 : 0)}/{targetPhotoCount}
            </div>

            {/* Mirror Toggle Button */}
            {capturePhase !== 'REVIEW' && (
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                className="absolute top-3 right-3 bg-white border-2 border-[#202030] p-2 rounded-full hover:bg-[#faf8ff] transition shadow-[0_2px_0_#202030] z-20"
                title="Flip Camera Mirror"
              >
                <FlipHorizontal className="w-4 h-4 text-[#8e36ff]" />
              </button>
            )}
          </div>

          {/* Controls Below Camera */}
          <div className="w-full max-w-2xl flex flex-col gap-4">

            {/* Pose Selector — Only show before any capture starts */}
            {capturedPhotos.length === 0 && capturePhase === 'READY' && retakeIndex === null && (
              <div className="neo-box p-4">
                <label className="text-xs font-bold uppercase text-[#8e36ff] block mb-2 font-chillax">
                  Pilih Jumlah Foto
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTargetPhotoCount(4)}
                    className={`neo-btn py-2.5 text-sm font-bold ${
                      targetPhotoCount === 4
                        ? 'bg-[#8e36ff] text-white shadow-[2px_2px_0_#c9a8ff] ring-2 ring-[#8e36ff]/35'
                        : 'bg-[#faf8ff] text-[#2c2c36]'
                    }`}
                  >
                    4 Foto (Classic)
                  </button>
                  <button
                    onClick={() => setTargetPhotoCount(3)}
                    className={`neo-btn py-2.5 text-sm font-bold ${
                      targetPhotoCount === 3
                        ? 'bg-[#8e36ff] text-white shadow-[2px_2px_0_#c9a8ff] ring-2 ring-[#8e36ff]/35'
                        : 'bg-[#faf8ff] text-[#2c2c36]'
                    }`}
                  >
                    3 Foto (Trio)
                  </button>
                </div>
              </div>
            )}

            {/* Photo Thumbnails Row */}
            {(capturePhase === 'READY' || capturePhase === 'COUNTDOWN') && (
              <div className="neo-box p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-[#8e36ff] font-chillax">
                    Progress Foto ({capturedPhotos.length}/{targetPhotoCount})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: targetPhotoCount }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square neo-box border-2 overflow-hidden flex items-center justify-center text-xs font-bold ${
                        idx === currentPoseIndex
                          ? 'ring-2 ring-[#8e36ff] bg-[#faf8ff]'
                          : 'bg-[#faf8ff]'
                      } ${capturedPhotos[idx] ? '' : 'text-[#5c5c68]'}`}
                    >
                      {capturedPhotos[idx] ? (
                        <img
                          src={capturedPhotos[idx]}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>#{idx + 1}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {capturePhase === 'READY' && (
              <button
                onClick={startSingleCountdown}
                disabled={!!cameraError}
                className="neo-btn-primary py-4 px-8 text-base font-bold flex items-center justify-center gap-2 w-full disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                {retakeIndex !== null
                  ? `Ulangi Foto #${retakeIndex + 1}`
                  : `Ambil Foto #${currentPoseIndex + 1}`
                }
              </button>
            )}

            {capturePhase === 'REVIEW' && (
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={handleRetakePhoto}
                  className="neo-btn py-3.5 px-6 text-sm font-bold flex items-center justify-center gap-2 flex-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Ulangi Foto Ini
                </button>
                <button
                  onClick={handleAcceptPhoto}
                  className="neo-btn-primary py-3.5 px-6 text-sm font-bold flex items-center justify-center gap-2 flex-1"
                >
                  <ArrowRight className="w-4 h-4" />
                  {(retakeIndex !== null) || (capturedPhotos.length + 1 >= targetPhotoCount)
                    ? 'Simpan'
                    : 'Simpan & Lanjut'
                  }
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
