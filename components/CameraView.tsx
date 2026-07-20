'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, FlipHorizontal, Play, Sparkles, AlertCircle } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface CameraViewProps {
  onPhotosCaptured: (capturedImages: string[], photoCount: number) => void;
}

export default function CameraView({ onPhotosCaptured }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  
  // Settings & Capture State
  const [targetPhotoCount, setTargetPhotoCount] = useState<3 | 4>(4);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturingSequence, setIsCapturingSequence] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState<number>(0);
  const [showFlash, setShowFlash] = useState(false);

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
      setCameraError('Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses webcam di browser!');
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

  // Start Automated Photobooth Multi-Pose Countdown Sequence
  const startPhotoSequence = () => {
    setCapturedPhotos([]);
    setCurrentPoseIndex(0);
    setIsCapturingSequence(true);
    runSinglePoseCountdown(0, []);
  };

  const runSinglePoseCountdown = (poseIdx: number, accumulated: string[]) => {
    setCurrentPoseIndex(poseIdx + 1);
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
          const updatedPhotos = [...accumulated, frameData];
          setCapturedPhotos(updatedPhotos);

          if (poseIdx + 1 < targetPhotoCount) {
            // Wait 1.5 seconds between poses for user to change expression
            setTimeout(() => {
              runSinglePoseCountdown(poseIdx + 1, updatedPhotos);
            }, 1500);
          } else {
            // All photos captured!
            setIsCapturingSequence(false);
            soundFx.playSuccessCheer();
            setTimeout(() => {
              onPhotosCaptured(updatedPhotos, targetPhotoCount);
            }, 1000);
          }
        }
      }
    }, 1000);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-center gap-6 justify-center">
      
      {/* Camera Live View Container */}
      <div className="relative w-full max-w-lg aspect-[4/3] neo-box border-4 bg-[#1A1325] overflow-hidden flex items-center justify-center">
        
        {/* Flash Effect Layer */}
        {showFlash && (
          <div className="absolute inset-0 bg-white z-40 animate-camera-flash pointer-events-none" />
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 bg-[#1A1325]/40 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none">
            <span className="text-8xl font-extrabold font-doodle text-[#FFE01B] drop-shadow-[4px_4px_0px_#1A1325] animate-bounce">
              {countdown}
            </span>
            <span className="text-xl font-bold text-white mt-2 bg-[#E52528] px-4 py-1 rounded-full neo-box border-2">
              POSE #{currentPoseIndex} DECK! 📸
            </span>
          </div>
        )}

        {/* Video Stream Element */}
        {cameraError ? (
          <div className="p-6 text-center text-white flex flex-col items-center gap-3">
            <AlertCircle className="w-12 h-12 text-[#E52528]" />
            <p className="font-bold text-sm text-red-300">{cameraError}</p>
            <button
              onClick={startCamera}
              className="neo-btn px-4 py-2 bg-[#FFE01B] text-black text-xs font-bold"
            >
              COBA LAGI / REFRESH
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
          />
        )}

        {/* Camera Live Badge */}
        <div className="absolute top-3 left-3 bg-[#E52528] text-white text-xs font-extrabold px-3 py-1 rounded-full border-2 border-[#1A1325] shadow-[2px_2px_0px_#1A1325] flex items-center gap-1.5 z-20">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          LIVE WEBCAM
        </div>

        {/* Mirror Toggle Button */}
        <button
          onClick={() => setIsMirrored(!isMirrored)}
          className="absolute top-3 right-3 bg-[#FFFFFF] border-2 border-[#1A1325] p-2 rounded-full hover:bg-[#FFE01B] transition shadow-[2px_2px_0px_#1A1325] z-20"
          title="Flip Camera Mirror"
        >
          <FlipHorizontal className="w-4 h-4 text-[#1B52D8]" />
        </button>
      </div>

      {/* Photobooth Side Control Panel */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        
        {/* Session Pose Selector */}
        <div className="neo-box p-4 bg-[#FFFFFF]">
          <label className="text-xs font-extrabold uppercase text-[#1B52D8] block mb-2 font-doodle">
            1. PILIH JUMLAH POSE (POSE COUNT)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => !isCapturingSequence && setTargetPhotoCount(4)}
              disabled={isCapturingSequence}
              className={`neo-btn py-2 text-xs font-bold ${
                targetPhotoCount === 4 ? 'bg-[#FFE01B] text-[#1A1325] border-3' : 'bg-[#FFFBEA] text-gray-600'
              }`}
            >
              📸 4 POSES (Classic)
            </button>
            <button
              onClick={() => !isCapturingSequence && setTargetPhotoCount(3)}
              disabled={isCapturingSequence}
              className={`neo-btn py-2 text-xs font-bold ${
                targetPhotoCount === 3 ? 'bg-[#FFE01B] text-[#1A1325] border-3' : 'bg-[#FFFBEA] text-gray-600'
              }`}
            >
              📸 3 POSES (Trio)
            </button>
          </div>
        </div>

        {/* Live Pose Preview Grid */}
        <div className="neo-box p-4 bg-[#FFFFFF]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase text-[#1B52D8] font-doodle">
              2. HASIL POSE FOTO ({capturedPhotos.length}/{targetPhotoCount})
            </span>
            {isCapturingSequence && (
              <span className="text-xs font-bold text-[#E52528] animate-pulse">
                Taking photos...
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: targetPhotoCount }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-square neo-box border-2 bg-[#FFFBEA] overflow-hidden flex items-center justify-center text-xs font-bold text-gray-400"
              >
                {capturedPhotos[idx] ? (
                  <img
                    src={capturedPhotos[idx]}
                    alt={`Pose ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>#{idx + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Action Snap Button */}
        <button
          onClick={startPhotoSequence}
          disabled={isCapturingSequence || !!cameraError}
          className="neo-btn py-4 bg-[#E52528] text-white text-base md:text-lg font-extrabold flex items-center justify-center gap-2 hover:bg-[#1B52D8] transition border-4 disabled:opacity-50 shadow-[5px_5px_0px_#1A1325]"
        >
          <Camera className="w-6 h-6" />
          {isCapturingSequence ? `AMBIL POSE #${currentPoseIndex}...` : 'MULAI FOTO SEKARANG! 📸'}
        </button>

      </div>

    </div>
  );
}
