'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Tag, Camera, RotateCcw, HelpCircle, Gamepad2 } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface ArcadeCabinetProps {
  children: React.ReactNode;
  step: 'IDLE' | 'CAMERA_SETUP' | 'COUNTDOWN_CAPTURE' | 'FRAME_COMPOSITOR' | 'RESULT';
  onInsertCoin: () => void;
  onReset: () => void;
}

export default function ArcadeCabinet({ children, step, onInsertCoin, onReset }: ArcadeCabinetProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const toggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handleCoinClick = () => {
    soundFx.playCoinSound();
    onInsertCoin();
  };

  return (
    <div className="relative min-h-screen bg-[#f5f5f5] bg-grid text-[#202030] flex flex-col items-center justify-between p-3 md:p-6 select-none overflow-x-hidden">
      
      {/* Main Arcade Frame Container */}
      <div className="w-full max-w-4xl neo-box bg-[#ffffff] overflow-hidden flex flex-col z-10 my-auto">
        
        {/* Clean Navbar Header */}
        <div className="w-full border-b-2 border-[#202030] p-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#ffffff]">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-[#8e36ff]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-wider font-chillax text-[#202030]">
                SKETCHIE BOX
              </h1>
              <p className="text-xs text-[#5c5c68] font-medium tracking-wide">
                Pengalaman Photobooth Modern
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 md:mt-0">
            {/* READY Badge */}
            <div className="neo-box-yellow px-3 py-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
              SIAP!
            </div>
            
            {/* Price List Button */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setShowPriceList(true);
              }}
              className="neo-btn px-3 py-1 text-xs flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" />
              HARGA
            </button>

            {/* Controls */}
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={toggleSound}
                className="neo-btn p-1.5"
                title="Toggle Sound"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-[#ef4444]" /> : <Volume2 className="w-4 h-4 text-[#8e36ff]" />}
              </button>
              <button
                onClick={() => setShowHelpModal(true)}
                className="neo-btn p-1.5"
                title="Help & Instructions"
              >
                <HelpCircle className="w-4 h-4 text-[#8e36ff]" />
              </button>
            </div>
          </div>
        </div>

        {/* Arcade Viewport Display */}
        <div className="p-4 md:p-6 bg-[#faf8ff] flex-1 flex flex-col items-center justify-center min-h-[460px] relative">
          {children}
        </div>

        {/* Bottom Control Arcade Deck */}
        <div className="bg-[#ffffff] border-t-2 border-[#202030] p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Machine Info / Status */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#202030]">
              {step === 'IDLE' && 'Standby - Tekan tombol untuk mulai'}
              {step === 'CAMERA_SETUP' && 'Siap pose - Sesuaikan kamera'}
              {step === 'COUNTDOWN_CAPTURE' && 'Mengambil foto... Bersiap!'}
              {step === 'FRAME_COMPOSITOR' && 'Sesuaikan bingkai dan stiker'}
              {step === 'RESULT' && 'Photo strip dan GIF siap diunduh'}
            </span>
          </div>

          {/* Interactive Action Slot Controls */}
          <div className="flex items-center gap-3">
            {step === 'IDLE' ? (
              <button
                onClick={handleCoinClick}
                className="neo-btn-primary px-6 py-2.5 font-extrabold text-sm md:text-base flex items-center gap-2 animate-pulse-glow"
              >
                <Camera className="w-5 h-5" />
                MULAI FOTO
              </button>
            ) : (
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  onReset();
                }}
                className="neo-btn px-4 py-2 text-[#202030] text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                SESI BARU
              </button>
            )}
          </div>
        </div>

      </div>

      {/* PRICE LIST MODAL */}
      {showPriceList && (
        <div className="fixed inset-0 bg-[#202030]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="neo-box max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowPriceList(false)}
              className="absolute top-4 right-4 neo-btn-danger px-2.5 py-1 text-xs"
            >
              TUTUP
            </button>
            
            <div className="flex items-center gap-2 mb-4 border-b-2 border-[#202030] pb-3">
              <Tag className="w-7 h-7 text-[#8e36ff]" />
              <div>
                <h2 className="text-2xl font-bold font-chillax text-[#8e36ff]">DAFTAR HARGA</h2>
                <p className="text-xs text-[#5c5c68]">Layanan Photobooth Sketchie Box</p>
              </div>
            </div>

            <div className="space-y-3 font-sans">
              <div className="neo-box-yellow p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">Strip Klasik 4-Pose</div>
                  <div className="text-xs text-[#5c5c68]">4 pose + Bingkai Kustom</div>
                </div>
                <div className="font-extrabold text-[#ef4444] text-lg">GRATIS!</div>
              </div>

              <div className="neo-box-pink p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">GIF Animasi Looping</div>
                  <div className="text-xs text-[#5c5c68]">Ekspor animasi boomerang</div>
                </div>
                <div className="font-extrabold text-[#8e36ff] text-lg">GRATIS!</div>
              </div>

              <div className="neo-box p-3 flex items-center justify-between bg-[#faf8ff]">
                <div>
                  <div className="font-bold text-sm">Stiker Doodle Tanpa Batas</div>
                  <div className="text-xs text-[#5c5c68]">Bintang, hati, permen & lencana</div>
                </div>
                <div className="font-extrabold text-[#10B981] text-lg">TERMASUK</div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => {
                  setShowPriceList(false);
                  handleCoinClick();
                }}
                className="w-full neo-btn-yellow py-3 font-extrabold text-base flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                MULAI SEKARANG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-[#202030]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="neo-box max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 neo-btn-danger px-2.5 py-1 text-xs"
            >
              TUTUP
            </button>

            <h2 className="text-2xl font-bold font-chillax text-[#8e36ff] mb-3 flex items-center gap-2">
              <Camera className="w-6 h-6" /> CARA BERMAIN
            </h2>

            <ol className="list-decimal list-inside space-y-2 text-sm font-sans text-[#202030] border-t-2 border-[#202030] pt-3">
              <li>Klik tombol <strong>MASUKKAN KOIN</strong> untuk mengaktifkan kamera.</li>
              <li>Izinkan akses browser ke webcam Anda.</li>
              <li>Pilih mode 3 pose atau 4 pose foto.</li>
              <li>Hitungan mundur akan berjalan otomatis setiap sesi pose.</li>
              <li>Pilih template bingkai favorit dan beri stiker doodle lucu.</li>
              <li>Unduh hasil akhir berupa Photo Strip dan Animasi GIF.</li>
            </ol>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full neo-btn-primary py-2.5 font-bold text-sm mt-5"
            >
              PAHAM, AYO MULAI!
            </button>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="mt-4 text-center text-xs text-[#5c5c68] font-medium">
        Designed for <strong className="text-[#8e36ff]">Sketchie Box Arcade</strong> • Powered by Next.js & React
      </footer>
    </div>
  );
}
