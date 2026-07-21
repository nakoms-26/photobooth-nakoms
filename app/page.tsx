'use client';

import React, { useState } from 'react';
import ArcadeCabinet from '@/components/ArcadeCabinet';
import CameraView from '@/components/CameraView';
import FrameCompositor from '@/components/FrameCompositor';
import DownloadStudio from '@/components/DownloadStudio';
import { Camera, Wand2, Images, Sparkles, Download, ArrowRight, Star, Zap, Film } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

type AppStep = 'IDLE' | 'CAMERA_SETUP' | 'COUNTDOWN_CAPTURE' | 'FRAME_COMPOSITOR' | 'RESULT';

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

  // ===== IDLE STATE: Full Landing Page (Jepreto style) =====
  if (step === 'IDLE') {
    return (
      <div className="min-h-screen bg-grid bg-[#f5f5f5]">

        {/* Sticky Navbar */}
        <header className="sticky top-0 z-50 w-full">
          <div className="mx-auto max-w-7xl px-4 pb-2 pt-3 sm:px-6 sm:pt-4 lg:px-8">
            <div className="flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl border-2 border-[#202030] bg-white px-3 py-2 shadow-[0_6px_0_#202030] sm:gap-3 sm:px-5">
              {/* Logo */}
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8e36ff]">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-black font-chillax text-[#202030] sm:text-xl">
                  SNAPKOMS
                </span>
              </div>

              {/* Nav Pills (desktop) */}
              <nav className="hidden md:flex items-center gap-0.5 rounded-xl bg-[#faf8ff] p-1">
                <button className="rounded-lg bg-white text-[#8e36ff] shadow-[2px_2px_0_#c9a8ff] ring-2 ring-[#8e36ff]/35 h-9 px-4 text-sm font-semibold font-chillax flex items-center gap-1.5 transition-all">
                  <Star className="h-4 w-4 text-[#8e36ff]" />
                  Home
                </button>
                <button
                  onClick={handleStartSession}
                  className="rounded-lg text-[#2c2c36] hover:bg-white hover:shadow-[2px_2px_0_#d4d4dc] h-9 px-4 text-sm font-semibold font-chillax flex items-center gap-1.5 transition-all"
                >
                  <Camera className="h-4 w-4 text-[#5c5c68]" />
                  Booth
                </button>
              </nav>

              {/* CTA Button */}
              <button
                onClick={handleStartSession}
                className="neo-btn-primary px-4 py-2 text-sm font-bold flex items-center gap-1.5"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Mulai Foto</span>
                <span className="sm:hidden">Foto</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="font-chillax mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
          <section className="grid items-center gap-10 lg:grid-cols-2">
            {/* Left: Text */}
            <div>
              <h1 className="font-chillax text-center text-5xl font-black leading-tight text-white [text-shadow:-1px_-1px_0_#232323,1px_-1px_0_#232323,-1px_1px_0_#232323,1px_1px_0_#232323,-3px_2px_0_#232323] sm:[text-shadow:-1px_-1px_0_#232323,1px_-1px_0_#232323,-1px_1px_0_#232323,1px_1px_0_#232323,-6px_4px_0_#232323] sm:text-5xl md:text-7xl lg:text-left">
                Abadikan Momen{' '}
                <span className="block text-[#f8d22a] [text-shadow:-1px_-1px_0_#232323,1px_-1px_0_#232323,-1px_1px_0_#232323,1px_1px_0_#232323,-3px_2px_0_#232323] sm:[text-shadow:-1px_-1px_0_#232323,1px_-1px_0_#232323,-1px_1px_0_#232323,1px_1px_0_#232323,-6px_4px_0_#232323]">
                  Bareng Snapkoms!
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-xl text-center text-base font-medium text-[#2a2a36] sm:text-lg lg:mx-0 lg:text-left">
                Abadikan momen seru bersama teman dengan photobooth digital yang keren, praktis, dan modern. Langsung di browser tanpa install apapun.
              </p>

              {/* CTA Button */}
              <div className="mt-8 flex justify-center lg:justify-start">
                <button
                  onClick={handleStartSession}
                  className="h-12 rounded-full border-2 border-[#202030] bg-[#8e36ff] px-8 text-base font-bold text-white shadow-[0_8px_0_#1d102f] transition-all duration-150 hover:translate-y-[3px] hover:bg-[#7f2cf1] hover:shadow-[0_5px_0_#1d102f] active:translate-y-[8px] active:shadow-none flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Coba Sekarang
                </button>
              </div>

              {/* Stats Row */}
              <div className="mx-auto mt-10 flex w-full max-w-xl flex-col divide-y divide-[#34343f66] sm:flex-row sm:divide-x sm:divide-y-0 lg:mx-0">
                <div className="py-4 text-center sm:py-3 sm:pr-6">
                  <p className="font-chillax text-4xl font-black text-[#8e36ff] [text-shadow:-1px_-1px_0px_#ffffff,1px_-1px_0px_#ffffff,-1px_1px_0px_#ffffff,1px_1px_0px_#ffffff,2px_4px_0px_#FF81F8] sm:text-5xl">
                    100%
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#2c2c36] sm:text-base">
                    Gratis
                  </p>
                </div>
                <div className="py-4 text-center sm:px-6 sm:py-3">
                  <p className="font-chillax text-4xl font-black text-[#8e36ff] [text-shadow:-1px_-1px_0px_#ffffff,1px_-1px_0px_#ffffff,-1px_1px_0px_#ffffff,1px_1px_0px_#ffffff,2px_4px_0px_#FF81F8] sm:text-5xl">
                    PNG+GIF
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#2c2c36] sm:text-base">
                    Format export
                  </p>
                </div>
                <div className="py-4 text-center sm:py-3 sm:pl-6">
                  <p className="font-chillax text-4xl font-black text-[#8e36ff] [text-shadow:-1px_-1px_0px_#ffffff,1px_-1px_0px_#ffffff,-1px_1px_0px_#ffffff,1px_1px_0px_#ffffff,2px_4px_0px_#FF81F8] sm:text-5xl">
                    4+
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#2c2c36] sm:text-base">
                    Template frame
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Visual Illustration (built with cards + icons) */}
            <div className="flex w-full flex-col items-center justify-center gap-6">
              {/* Main visual — stacked photo cards */}
              <div className="relative w-full max-w-[420px] aspect-square">
                {/* Background card */}
                <div className="absolute top-8 left-8 right-8 bottom-0 rounded-3xl border-2 border-[#f28df8] bg-[#f28df8]/20 rotate-[-6deg]" />
                {/* Middle card */}
                <div className="absolute top-4 left-4 right-4 bottom-4 rounded-3xl border-2 border-[#c9a8ff] bg-[#c9a8ff]/20 rotate-[3deg]" />
                {/* Front card */}
                <div className="relative rounded-3xl border-2 border-[#202030] bg-white p-6 shadow-[0_10px_0_#202030] flex flex-col items-center justify-center gap-4 h-full">
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8e36ff]">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f8d22a] border-2 border-[#202030]">
                      <Sparkles className="h-8 w-8 text-[#202030]" />
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f28df8]">
                      <Film className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-chillax text-2xl font-black text-[#202030] text-center">
                    Digital Photobooth
                  </h3>
                  <p className="text-sm text-[#5c5c68] text-center max-w-[280px]">
                    Ambil foto, pilih frame, tambah stiker, download PNG dan GIF
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="neo-box px-3 py-1 text-xs font-bold text-[#8e36ff]">PNG Export</span>
                    <span className="neo-box px-3 py-1 text-xs font-bold text-[#f28df8]">GIF Animated</span>
                  </div>
                </div>
              </div>

              {/* Bottom CTA — Yellow button */}
              <button
                onClick={handleStartSession}
                className="w-full max-w-[420px] h-14 rounded-2xl border-2 border-[#202030] bg-[#f8d22a] text-lg font-black text-[#202030] shadow-[0_10px_0_#17171f] transition-all duration-150 hover:translate-y-[4px] hover:bg-[#f4d230] hover:shadow-[0_6px_0_#17171f] active:translate-y-[10px] active:shadow-none flex items-center justify-center gap-2"
              >
                Mulai Foto Sekarang
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="relative left-1/2 right-1/2 mt-20 w-screen -translate-x-1/2 bg-[#8e36ff] py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="grid items-end gap-6 md:grid-cols-2 mb-10">
                <h2 className="font-chillax text-5xl font-black text-white [text-shadow:-1px_-1px_0_#232323,1px_-1px_0_#232323,-1px_1px_0_#232323,1px_1px_0_#232323,-3px_2px_0_#232323] sm:[text-shadow:-1px_-1px_0_#232323,1px_-1px_0_#232323,-1px_1px_0_#232323,1px_1px_0_#232323,-6px_4px_0_#232323]">
                  <span className="text-[#f8d22a]">Cara</span>{' '}
                  <span className="text-[#f28df8]">Kerjanya</span>
                </h2>
                <p className="text-lg font-semibold text-white/90">
                  Photobooth digital langsung di browser. Tanpa install, tanpa ribet.
                </p>
              </div>

              {/* Step Cards */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    step: 1,
                    icon: <Camera className="h-9 w-9 text-white" />,
                    title: 'Buka kamera',
                    desc: 'Klik mulai dan izinkan akses kamera browser. Langsung siap foto.',
                    color: '#f28df8',
                  },
                  {
                    step: 2,
                    icon: <Zap className="h-9 w-9 text-white" />,
                    title: 'Ambil foto',
                    desc: 'Ambil 3 atau 4 foto secara manual. Bisa retake kapan saja.',
                    color: '#f8d22a',
                  },
                  {
                    step: 3,
                    icon: <Wand2 className="h-9 w-9 text-white" />,
                    title: 'Pilih frame',
                    desc: 'Pilih template bingkai favorit, tambahkan filter dan stiker.',
                    color: '#8e36ff',
                  },
                  {
                    step: 4,
                    icon: <Download className="h-9 w-9 text-white" />,
                    title: 'Download hasil',
                    desc: 'Unduh photo strip PNG dan animated GIF langsung ke perangkat.',
                    color: '#f28df8',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="relative rounded-3xl border-2 bg-white p-6 text-center shadow-[6px_6px_0]"
                    style={{
                      borderColor: item.color,
                      boxShadow: `6px 6px 0 ${item.color}`,
                    }}
                  >
                    <div
                      className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-lg font-black text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.step}
                    </div>
                    <div
                      className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.icon}
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-[#1f1f27]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-base text-[#2f2f39]">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleStartSession}
                  className="h-14 rounded-2xl border-2 border-[#202030] bg-[#f8d22a] px-10 text-lg font-black text-[#202030] shadow-[0_10px_0_#17171f] transition-all duration-150 hover:translate-y-[4px] hover:shadow-[0_6px_0_#17171f] active:translate-y-[10px] active:shadow-none flex items-center gap-2"
                >
                  Mulai Foto Sekarang
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>

          {/* Features Strip */}
          <section className="py-16">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="neo-box p-6 text-center rounded-2xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8e36ff] mb-4">
                  <Images className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#1f1f27]">Multi Template</h3>
                <p className="mt-2 text-sm text-[#5c5c68]">Pilih dari berbagai template frame keren untuk foto kamu</p>
              </div>
              <div className="neo-box p-6 text-center rounded-2xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f28df8] mb-4">
                  <Film className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#1f1f27]">Export GIF</h3>
                <p className="mt-2 text-sm text-[#5c5c68]">Buat animated GIF boomerang dari foto yang sudah diambil</p>
              </div>
              <div className="neo-box p-6 text-center rounded-2xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8d22a] border-2 border-[#202030] mb-4">
                  <Sparkles className="h-7 w-7 text-[#202030]" />
                </div>
                <h3 className="text-lg font-bold text-[#1f1f27]">Stiker dan Filter</h3>
                <p className="mt-2 text-sm text-[#5c5c68]">Tambahkan stiker doodle dan filter warna ke foto kamu</p>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t-2 border-[#202030] bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8e36ff]">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                <span className="font-chillax text-base font-bold text-[#202030]">SNAPKOMS</span>
              </div>
              <p className="text-sm text-[#5c5c68]">
                Digital photobooth modern dan praktis. Powered by Next.js dan React.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ===== NON-IDLE STATES: Inside ArcadeCabinet shell =====
  return (
    <ArcadeCabinet step={step} onInsertCoin={handleStartSession} onReset={handleReset}>

      {/* STEP 2: CAMERA CAPTURE STUDIO */}
      {(step === 'CAMERA_SETUP' || step === 'COUNTDOWN_CAPTURE') && (
        <CameraView onPhotosCaptured={handlePhotosCaptured} />
      )}

      {/* STEP 3: FRAME COMPOSITOR */}
      {step === 'FRAME_COMPOSITOR' && (
        <div className="w-full flex flex-col items-center gap-4">
          <FrameCompositor
            photos={capturedPhotos}
            onCompositeGenerated={(pngData) => setCompositePng(pngData)}
          />
          <button
            onClick={handleGoToResult}
            disabled={!compositePng}
            className="neo-btn-primary py-3.5 px-8 text-base font-bold flex items-center gap-2 disabled:opacity-50 mt-2"
          >
            <Wand2 className="w-5 h-5" />
            Selesai dan Export (PNG dan GIF)
          </button>
        </div>
      )}

      {/* STEP 4: RESULT DOWNLOAD STUDIO */}
      {step === 'RESULT' && (
        <DownloadStudio
          pngDataUrl={compositePng}
          capturedPhotos={capturedPhotos}
          onResetSession={handleReset}
        />
      )}

    </ArcadeCabinet>
  );
}
