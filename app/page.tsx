'use client';

import React, { useState } from 'react';
import SplashScreen from '@/components/SplashScreen';
import CameraView from '@/components/CameraView';
import FrameCompositor from '@/components/FrameCompositor';
import DownloadStudio from '@/components/DownloadStudio';
import { Wand2 } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

type AppStep = 'IDLE' | 'CAMERA_SETUP' | 'FRAME_COMPOSITOR' | 'RESULT';

export default function Home() {
  const [step, setStep] = useState<AppStep>('IDLE');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [compositePng, setCompositePng] = useState<string>('');

  const handleStartSession = () => {
    soundFx.playCoinSound();
    setStep('CAMERA_SETUP');
  };

  const handlePhotosCaptured = (photos: string[]) => {
    setCapturedPhotos(photos);
    setStep('FRAME_COMPOSITOR');
  };

  const handleGoToResult = () => {
    soundFx.playSuccessCheer();
    setStep('RESULT');
  };

  const handleReset = () => {
    setCapturedPhotos([]);
    setCompositePng('');
    setStep('IDLE');
  };

  // SPLASH / IDLE
  if (step === 'IDLE') {
    return <SplashScreen onStart={handleStartSession} />;
  }

  // CAMERA
  if (step === 'CAMERA_SETUP') {
    return <CameraView onPhotosCaptured={handlePhotosCaptured} />;
  }

  // FRAME COMPOSITOR
  if (step === 'FRAME_COMPOSITOR') {
    return (
      <FrameCompositor
        photos={capturedPhotos}
        onCompositeGenerated={(pngData) => setCompositePng(pngData)}
        actions={
          <button
            onClick={handleGoToResult}
            disabled={!compositePng}
            id="save-composite-btn"
            className="w-full py-4 rounded-xl border-2 border-black font-chillax font-black text-black text-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-secondary)',
              boxShadow: '0 6px 0 #000',
            }}
          >
            <Wand2 className="w-6 h-6" />
            Selesai & Simpan
          </button>
        }
      />
    );
  }

  // RESULT
  if (step === 'RESULT') {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center py-6 px-4 relative bg-grid overflow-y-auto">
        <DownloadStudio
          pngDataUrl={compositePng}
          capturedPhotos={capturedPhotos}
          onResetSession={handleReset}
        />
      </div>
    );
  }

  return null;
}
