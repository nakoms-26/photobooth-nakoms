"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Camera,
  FlipHorizontal,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Check,
} from "lucide-react";
import { soundFx } from "@/lib/soundEffects";

interface CameraViewProps {
  onPhotosCaptured: (capturedImages: string[]) => void;
}

type CapturePhase = "READY" | "COUNTDOWN" | "REVIEW" | "REVIEW_ALL";

const TARGET_PHOTO_COUNT = 3;

const FILTERS = [
  { id: "none", label: "ORIGINAL", css: "none" },
  {
    id: "dark_room",
    label: "DARK ROOM",
    css: "contrast(1.15) brightness(0.9) saturate(1.1) sepia(0.1)",
  },
  {
    id: "retro",
    label: "RETRO",
    css: "sepia(0.4) contrast(1.1) brightness(1.1) saturate(1.2)",
  },
  {
    id: "film",
    label: "FILM",
    css: "contrast(1.2) saturate(0.9) sepia(0.2) hue-rotate(-10deg)",
  },
  {
    id: "flash",
    label: "FLASH",
    css: "brightness(1.2) contrast(1.1) saturate(1.1)",
  },
  {
    id: "noir",
    label: "NOIR",
    css: "grayscale(1) contrast(1.2) brightness(0.95)",
  },
];

export default function CameraView({ onPhotosCaptured }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);

  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [capturePhase, setCapturePhase] = useState<CapturePhase>("READY");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState<number>(0);
  const [showFlash, setShowFlash] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(
    null,
  );
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  const [selectedFilter, setSelectedFilter] = useState("none");
  const [filterThumbnail, setFilterThumbnail] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });
      streamRef.current = mediaStream;
      setCameraError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraError(
        "Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses webcam di browser.",
      );
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 0);
    return () => {
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  const captureCurrentFrame = useCallback(
    (applyFilter = true) => {
      if (!videoRef.current) return null;
      const video = videoRef.current;
      let canvas = hiddenCanvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        hiddenCanvasRef.current = canvas;
      }
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.save();
      if (isMirrored) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      if (applyFilter) {
        ctx.filter =
          FILTERS.find((f) => f.id === selectedFilter)?.css || "none";
      }
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
      // Compress frame as JPEG instead of PNG to save payload size (Vercel limit 4.5MB)
      return canvas.toDataURL("image/jpeg", 0.85);
    },
    [isMirrored, selectedFilter],
  );

  const handleVideoPlay = () => {
    if (!filterThumbnail) {
      setTimeout(() => {
        const thumb = captureCurrentFrame(false);
        if (thumb) setFilterThumbnail(thumb);
      }, 1000);
    }
  };

  const startSingleCountdown = () => {
    if (capturePhase === "COUNTDOWN") return;
    setCapturePhase("COUNTDOWN");
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
        setShowFlash(true);
        soundFx.playShutterSound();
        soundFx.playFlashBeep();
        setTimeout(() => setShowFlash(false), 300);
        const frameData = captureCurrentFrame(true);
        if (frameData) {
          setLastCapturedPhoto(frameData);
          setCapturePhase("REVIEW");
        } else {
          setCapturePhase("READY");
        }
      }
    }, 1000);
  };

  const handleAcceptPhoto = () => {
    if (!lastCapturedPhoto) return;
    soundFx.playClickSound();
    if (retakeIndex !== null) {
      const updated = [...capturedPhotos];
      updated[retakeIndex] = lastCapturedPhoto;
      setCapturedPhotos(updated);
      setRetakeIndex(null);
      setLastCapturedPhoto(null);
      setCapturePhase("REVIEW_ALL");
    } else {
      const updatedPhotos = [...capturedPhotos, lastCapturedPhoto];
      setCapturedPhotos(updatedPhotos);
      setLastCapturedPhoto(null);
      if (updatedPhotos.length >= TARGET_PHOTO_COUNT) {
        soundFx.playSuccessCheer();
        setCapturePhase("REVIEW_ALL");
      } else {
        setCurrentPoseIndex(updatedPhotos.length);
        setCapturePhase("READY");
      }
    }
  };

  const handleRetakePhoto = () => {
    soundFx.playClickSound();
    setLastCapturedPhoto(null);
    setCapturePhase("READY");
  };

  const handleRetakeFromGrid = (index: number) => {
    soundFx.playClickSound();
    setRetakeIndex(index);
    setCurrentPoseIndex(index);
    setLastCapturedPhoto(null);
    setCapturePhase("READY");
  };

  const handleConfirmAll = useCallback(() => {
    soundFx.playSuccessCheer();
    onPhotosCaptured(capturedPhotos);
  }, [capturedPhotos, onPhotosCaptured]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (capturePhase === "READY" && countdown === null) {
          startSingleCountdown();
        } else if (capturePhase === "REVIEW") {
          handleAcceptPhoto();
        } else if (capturePhase === "REVIEW_ALL") {
          handleConfirmAll();
        }
      } else if (e.code === "Escape" || e.code === "Backspace") {
        if (capturePhase === "REVIEW") {
          handleRetakePhoto();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturePhase, countdown]);

  return (
    /* Root: fullscreen, camera is the ONLY background */
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[var(--color-background)]">
      {/* ── CAMERA / REVIEW FEED (absolute, fills entire screen) ── */}
      {cameraError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-background)] z-0">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-[var(--color-text)] font-bold text-sm font-chillax text-center px-8">
            {cameraError}
          </p>
          <button
            onClick={startCamera}
            className="neo-btn-primary px-6 py-3 font-chillax font-bold"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* Live video — fullscreen */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlay={handleVideoPlay}
            className={`absolute inset-0 w-full h-full object-cover ${capturePhase === "REVIEW" && lastCapturedPhoto ? "opacity-0" : "opacity-100"} ${isMirrored ? "scale-x-[-1]" : ""}`}
            style={{
              filter:
                FILTERS.find((f) => f.id === selectedFilter)?.css || "none",
            }}
          />

          {/* Review: show captured photo fullscreen */}
          {capturePhase === "REVIEW" && lastCapturedPhoto && (
            <img
              src={lastCapturedPhoto}
              alt="Review"
              className="absolute inset-0 w-full h-full object-cover z-10"
            />
          )}
        </>
      )}

      {/* ── WHITE FLASH ── */}
      {showFlash && (
        <div className="absolute inset-0 bg-white z-50 animate-camera-flash pointer-events-none" />
      )}

      {/* ── GRID GUIDE (faint lines, only during READY/COUNTDOWN) ── */}
      {(capturePhase === "READY" || capturePhase === "COUNTDOWN") && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="w-full h-full grid grid-rows-3 grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/15" />
            ))}
          </div>
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {countdown !== null && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none pb-[20vh]">
          <span
            className="font-chillax font-black text-[25vw] leading-none text-red-600"
            style={{ textShadow: "6px 6px 0 #fff, -2px -2px 0 #fff" }}
          >
            {countdown}
          </span>
        </div>
      )}

      {/* ── REVIEW_ALL: dimmed center prompt ── */}
      {capturePhase === "REVIEW_ALL" && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <div
            className="rounded-2xl border-2 border-black px-6 py-3 font-chillax text-center"
            style={{
              backgroundColor: "var(--color-secondary)",
              boxShadow: "0 6px 0 #000",
            }}
          >
            <p className="font-black text-black text-lg">Semua foto siap!</p>
            <p className="text-black/60 text-xs mt-0.5">
              Klik thumbnail untuk mengulang
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          OVERLAY UI — everything floats ON TOP of camera
          ═══════════════════════════════════════════════ */}

      {/* TOP-LEFT: progress badge */}
      {(capturePhase === "READY" || capturePhase === "COUNTDOWN") && (
        <div className="absolute top-4 left-4 z-40">
          <div
            className="px-3 py-1 rounded-full font-chillax font-black text-sm border-2 border-black text-black"
            style={{
              backgroundColor: "var(--color-secondary)",
              boxShadow: "0 3px 0 #000",
            }}
          >
            FOTO {Math.min(currentPoseIndex + 1, TARGET_PHOTO_COUNT)}/
            {TARGET_PHOTO_COUNT}
          </div>
        </div>
      )}

      {/* TOP-RIGHT: flip button */}
      {(capturePhase === "READY" || capturePhase === "COUNTDOWN") && (
        <button
          onClick={() => setIsMirrored(!isMirrored)}
          disabled={!!countdown}
          className="absolute top-4 right-4 z-40 w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm border border-black/10 flex items-center justify-center text-black disabled:opacity-30 hover:bg-white/90 transition-all"
          title="Flip Camera"
        >
          <FlipHorizontal className="w-5 h-5" />
        </button>
      )}

      {/* BOTTOM OVERLAY — gradient scrim + controls */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center gap-4 pb-6 pt-12 px-4">
        {/* Photo thumbnails strip */}
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: TARGET_PHOTO_COUNT }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (capturePhase === "REVIEW_ALL" && capturedPhotos[idx])
                  handleRetakeFromGrid(idx);
              }}
              className={`relative flex-shrink-0 aspect-video h-14 rounded-lg overflow-hidden border-2 transition-all
                ${capturePhase === "REVIEW_ALL" && capturedPhotos[idx] ? "cursor-pointer hover:scale-110" : ""}
                ${
                  idx === currentPoseIndex && !capturedPhotos[idx]
                    ? "border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.4)]"
                    : capturedPhotos[idx]
                      ? "border-black/30"
                      : "border-black/10"
                }
              `}
              style={{
                backgroundColor: capturedPhotos[idx]
                  ? "transparent"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {capturedPhotos[idx] ? (
                <img
                  src={capturedPhotos[idx]}
                  className="w-full h-full object-cover"
                  alt={`Foto ${idx + 1}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera
                    className={`w-4 h-4 ${idx === currentPoseIndex ? "text-red-500" : "text-black/30"}`}
                  />
                </div>
              )}
              {capturePhase === "REVIEW_ALL" && capturedPhotos[idx] && (
                <div className="absolute inset-0 bg-white/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-black" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Filter strip — only during READY/COUNTDOWN */}
        {(capturePhase === "READY" || capturePhase === "COUNTDOWN") && (
          <div className="w-full overflow-x-auto">
            <div className="flex gap-3 w-max mx-auto">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedFilter === f.id
                        ? "border-red-500 scale-110 shadow-sm"
                        : "border-black/20 hover:border-black/40"
                    }`}
                  >
                    {filterThumbnail ? (
                      <img
                        src={filterThumbnail}
                        className={`w-full h-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
                        style={{ filter: f.css }}
                        alt={f.label}
                      />
                    ) : (
                      <div className="w-full h-full bg-black/5 animate-pulse" />
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-chillax font-bold tracking-wider ${
                      selectedFilter === f.id ? "text-red-500" : "text-black/60"
                    }`}
                  >
                    {f.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action row: shutter / review / confirm */}
        <div className="flex items-center justify-center gap-6">
          {capturePhase === "REVIEW" ? (
            /* Retake or Accept */
            <div className="flex items-center gap-4">
              <button
                onClick={handleRetakePhoto}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-black/20 text-black font-chillax font-bold text-base hover:bg-white transition-all shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Ulangi
              </button>
              <button
                onClick={handleAcceptPhoto}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-black text-black font-chillax font-bold text-base hover:opacity-90 transition-all"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  boxShadow: "0 4px 0 #000",
                }}
              >
                <ArrowRight className="w-4 h-4" />
                Simpan
              </button>
            </div>
          ) : capturePhase === "REVIEW_ALL" ? (
            /* Confirm all */
            <button
              onClick={handleConfirmAll}
              className="flex items-center gap-2 px-10 py-3 rounded-xl border-2 border-black text-black font-chillax font-bold text-lg hover:opacity-90 transition-all active:scale-95"
              style={{
                backgroundColor: "var(--color-secondary)",
                boxShadow: "0 5px 0 #000",
              }}
            >
              <Check className="w-5 h-5" />
              Pilih Frame!
            </button>
          ) : (
            /* Shutter button */
            <button
              onClick={startSingleCountdown}
              disabled={!!countdown}
              id="shutter-btn"
              className="w-20 h-20 rounded-full border-[5px] border-white p-2 flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{
                boxShadow:
                  "0 0 0 3px rgba(255,255,255,0.2), 0 6px 20px rgba(0,0,0,0.5)",
              }}
            >
              <div className="w-full h-full rounded-full bg-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
