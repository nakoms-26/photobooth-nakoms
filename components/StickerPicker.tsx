'use client';

import React from 'react';
import { Smile } from 'lucide-react';

export interface StickerItem {
  id: string;
  emoji: string;
  label: string;
}

export const DOODLE_STICKERS: StickerItem[] = [
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'candy', emoji: '🍬', label: 'Candy' },
  { id: 'heart', emoji: '💖', label: 'Heart' },
  { id: 'sparkles', emoji: '✨', label: 'Sparkles' },
  { id: 'joystick', emoji: '🕹️', label: 'Arcade' },
  { id: 'crown', emoji: '👑', label: 'Crown' },
  { id: 'sunglasses', emoji: '🕶️', label: 'Shades' },
  { id: 'ribbon', emoji: '🎀', label: 'Ribbon' },
  { id: 'lightning', emoji: '⚡', label: 'Zap' },
  { id: 'balloon', emoji: '🎈', label: 'Balloon' },
  { id: 'carnival', emoji: '🎪', label: 'Booth' },
  { id: 'cherry', emoji: '🍒', label: 'Cherry' },
];

interface StickerPickerProps {
  onAddSticker: (sticker: StickerItem) => void;
}

export default function StickerPicker({ onAddSticker }: StickerPickerProps) {
  return (
    <div className="neo-box p-3 bg-[#FFFFFF] w-full">
      <div className="flex items-center gap-1.5 mb-2 font-doodle text-xs font-bold text-[#1B52D8]">
        <Smile className="w-4 h-4 text-[#FFE01B]" />
        TAMBAHKAN STIKER DOODLE (CLICK TO ADD)
      </div>
      <div className="grid grid-cols-6 gap-2">
        {DOODLE_STICKERS.map((stk) => (
          <button
            key={stk.id}
            onClick={() => onAddSticker(stk)}
            className="neo-btn p-2 text-xl hover:scale-110 flex items-center justify-center bg-[#FFFBEA]"
            title={stk.label}
          >
            {stk.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
