'use client';

import React, { useState } from 'react';
import { Sparkles, Coins, Volume2, VolumeX, Tag, Camera, RotateCcw, HelpCircle } from 'lucide-react';
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
    <div className="relative min-h-screen bg-[#FFFBEA] text-[#1A1325] flex flex-col items-center justify-between p-3 md:p-6 select-none overflow-x-hidden">
      
      {/* Background Decorative Doodle Stars & Candies */}
      <div className="absolute top-8 left-6 text-3xl animate-float opacity-80 pointer-events-none">⭐</div>
      <div className="absolute top-16 right-8 text-3xl animate-float opacity-80 pointer-events-none" style={{ animationDelay: '1.2s' }}>🍬</div>
      <div className="absolute bottom-12 left-10 text-4xl animate-float opacity-80 pointer-events-none" style={{ animationDelay: '2.4s' }}>✨</div>
      <div className="absolute bottom-20 right-12 text-3xl animate-float opacity-80 pointer-events-none" style={{ animationDelay: '0.6s' }}>🎈</div>

      {/* Main Arcade Frame Container */}
      <div className="w-full max-w-4xl neo-box border-[4px] bg-[#FFFFFF] overflow-hidden flex flex-col shadow-[8px_8px_0px_#1A1325] z-10 my-auto">
        
        {/* Carnival Awning Header */}
        <div className="carnival-awning h-12 w-full border-b-[4px] border-[#1A1325] flex items-center justify-center relative">
          <div className="absolute left-4 top-2 bg-[#FFE01B] border-2 border-[#1A1325] px-3 py-0.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#1A1325]">
            Vending Machine #01
          </div>
          <div className="absolute right-4 top-1.5 flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-1.5 bg-[#FFFFFF] border-2 border-[#1A1325] rounded-full hover:bg-[#FFE01B] transition shadow-[2px_2px_0px_#1A1325]"
              title="Toggle Sound"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#E52528]" /> : <Volume2 className="w-4 h-4 text-[#1B52D8]" />}
            </button>
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 bg-[#FFFFFF] border-2 border-[#1A1325] rounded-full hover:bg-[#FFE01B] transition shadow-[2px_2px_0px_#1A1325]"
              title="Help & Instructions"
            >
              <HelpCircle className="w-4 h-4 text-[#1B52D8]" />
            </button>
          </div>
        </div>

        {/* Marquee Title */}
        <div className="bg-[#1B52D8] text-[#FFE01B] border-b-[4px] border-[#1A1325] py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🕹️</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider font-doodle drop-shadow-[2px_2px_0px_#1A1325] text-[#FFE01B]">
                SKETCHIE BOX
              </h1>
              <p className="text-xs text-[#FFFFFF] font-medium tracking-wide">
                Nostalgic Playful Photobooth & Doodle Arcade
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 md:mt-0">
            {/* READY Badge */}
            <div className="neo-box-yellow px-3 py-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
              SLOT READY!
            </div>
            
            {/* Price List Button */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setShowPriceList(true);
              }}
              className="neo-btn px-3 py-1 text-xs flex items-center gap-1.5 bg-[#F3A3C7]"
            >
              <Tag className="w-3.5 h-3.5" />
              PRICE LIST
            </button>
          </div>
        </div>

        {/* Arcade Viewport Display */}
        <div className="p-4 md:p-6 bg-[#FFFBEA] flex-1 flex flex-col items-center justify-center min-h-[460px] relative">
          {children}
        </div>

        {/* Bottom Control Arcade Deck */}
        <div className="bg-[#FFFFFF] border-t-[4px] border-[#1A1325] p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Machine Info / Status */}
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#E52528] border-2 border-[#1A1325] shadow-[1px_1px_0px_#1A1325]" />
            <div className="w-4 h-4 rounded-full bg-[#FFE01B] border-2 border-[#1A1325] shadow-[1px_1px_0px_#1A1325]" />
            <div className="w-4 h-4 rounded-full bg-[#1B52D8] border-2 border-[#1A1325] shadow-[1px_1px_0px_#1A1325]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A1325] ml-1">
              {step === 'IDLE' && '🔴 Standby — Insert coin to start!'}
              {step === 'CAMERA_SETUP' && '🟡 Pose ready — Adjust your camera!'}
              {step === 'COUNTDOWN_CAPTURE' && '📸 Capturing photos... Get ready!'}
              {step === 'FRAME_COMPOSITOR' && '🎨 Customize your frame & stickers!'}
              {step === 'RESULT' && '✨ Photo strip & GIF ready for download!'}
            </span>
          </div>

          {/* Interactive Action Slot Controls */}
          <div className="flex items-center gap-3">
            {step === 'IDLE' ? (
              <button
                onClick={handleCoinClick}
                className="neo-btn px-6 py-2.5 bg-[#FFE01B] text-[#1A1325] font-extrabold text-sm md:text-base flex items-center gap-2 animate-coin-slot border-4"
              >
                <Coins className="w-5 h-5 text-[#E52528]" />
                INSERT COIN (FREE) 🪙
              </button>
            ) : (
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  onReset();
                }}
                className="neo-btn px-4 py-2 bg-[#F3A3C7] text-[#1A1325] text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                NEW SESSION 🔄
              </button>
            )}
          </div>
        </div>

      </div>

      {/* PRICE LIST MODAL */}
      {showPriceList && (
        <div className="fixed inset-0 bg-[#1A1325]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="neo-box max-w-md w-full bg-[#FFFFFF] border-4 p-6 relative">
            <button
              onClick={() => setShowPriceList(false)}
              className="absolute top-4 right-4 neo-btn px-2.5 py-1 text-xs bg-[#E52528] text-white"
            >
              ✖ CLOSE
            </button>
            
            <div className="flex items-center gap-2 mb-4 border-b-4 border-[#1A1325] pb-3">
              <span className="text-3xl">🏷️</span>
              <div>
                <h2 className="text-2xl font-bold font-doodle text-[#1B52D8]">PRICE LIST MENU</h2>
                <p className="text-xs text-gray-600">Sketchie Box Photobooth Service</p>
              </div>
            </div>

            <div className="space-y-3 font-doodle">
              <div className="neo-box-yellow p-3 flex items-center justify-between border-2">
                <div>
                  <div className="font-bold text-sm">📸 4-Pose Classic Strip</div>
                  <div className="text-xs font-sans text-gray-700">4 poses + Custom PNG Frames</div>
                </div>
                <div className="font-extrabold text-[#E52528] text-lg">FREE!</div>
              </div>

              <div className="neo-box-pink p-3 flex items-center justify-between border-2">
                <div>
                  <div className="font-bold text-sm">🎞️ Animated Looping GIF</div>
                  <div className="text-xs font-sans text-gray-700">Boomerang animation export</div>
                </div>
                <div className="font-extrabold text-[#1B52D8] text-lg">FREE!</div>
              </div>

              <div className="neo-box p-3 flex items-center justify-between border-2 bg-[#FFFBEA]">
                <div>
                  <div className="font-bold text-sm">🎨 Unlimited Doodle Stickers</div>
                  <div className="text-xs font-sans text-gray-700">Stars, hearts, candies & badges</div>
                </div>
                <div className="font-extrabold text-[#10B981] text-lg">INCLUDED</div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => {
                  setShowPriceList(false);
                  handleCoinClick();
                }}
                className="w-full neo-btn py-3 bg-[#FFE01B] font-extrabold text-base flex items-center justify-center gap-2"
              >
                <Coins className="w-5 h-5" />
                START NOW WITH 1 COIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-[#1A1325]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="neo-box max-w-md w-full bg-[#FFFFFF] border-4 p-6 relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 neo-btn px-2.5 py-1 text-xs bg-[#E52528] text-white"
            >
              ✖ CLOSE
            </button>

            <h2 className="text-2xl font-bold font-doodle text-[#1B52D8] mb-3 flex items-center gap-2">
              <Camera className="w-6 h-6" /> HOW TO PLAY
            </h2>

            <ol className="list-decimal list-inside space-y-2 text-sm font-sans text-gray-800 border-t-2 border-[#1A1325] pt-3">
              <li>Klik tombol <strong>INSERT COIN</strong> untuk mengaktifkan kamera.</li>
              <li>Izinkan akses browser ke webcam Anda.</li>
              <li>Pilih mode 3 pose atau 4 pose foto.</li>
              <li>Hitungan mundur (3.. 2.. 1..) akan berjalan otomatis setiap sesi pose.</li>
              <li>Pilih template bingkai PNG favorit dan beri stiker doodle lucu.</li>
              <li>Unduh hasil akhir berupa **Photo Strip PNG** dan **Animated GIF**!</li>
            </ol>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full neo-btn py-2.5 bg-[#1B52D8] text-white font-bold text-sm mt-5"
            >
              PAHAM, LETS SNAP! 📸
            </button>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="mt-4 text-center text-xs text-gray-500 font-medium">
        Designed for <strong className="text-[#1B52D8]">Sketchie Box Arcade</strong> • Powered by Next.js & React
      </footer>
    </div>
  );
}
