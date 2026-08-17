'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onStart: () => void;
}

export default function SplashScreen({ onStart }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStarting, setIsStarting] = useState(false);

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
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      // silently fail — image overlay still shows, user can still tap to start
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  const handleStart = useCallback(() => {
    if (isStarting) return;
    setIsStarting(true);
    setTimeout(() => onStart(), 200);
  }, [isStarting, onStart]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStart]);

  return (
    <div
      id="splash-screen"
      className="relative w-full h-[100dvh] overflow-hidden bg-black cursor-pointer select-none"
      onClick={handleStart}
    >
      {/* Live Camera Feed — fullscreen background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
      />

      {/* taptostart.png — fullscreen overlay */}
      <Image
        src="/taptostart.png"
        alt="Tap to Start"
        fill
        className="object-cover"
        priority
        draggable={false}
      />

      {/* Flash transition on tap */}
      <div
        className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200 ${
          isStarting ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
