'use client';

import React from 'react';
import { Smile, Star, Heart, Sparkles, Gamepad2, Crown, Zap, Gift, Eye } from 'lucide-react';

export interface StickerItem {
  id: string;
  label: string;
  color: string;
  icon: 'star' | 'heart' | 'sparkles' | 'joystick' | 'crown' | 'lightning' | 'gift' | 'sunglasses';
}

export const DOODLE_STICKERS: StickerItem[] = [
  { id: 'star', label: 'Bintang', color: '#fae03c', icon: 'star' },
  { id: 'heart', label: 'Hati', color: '#008dd1', icon: 'heart' },
  { id: 'sparkles', label: 'Sparkles', color: '#10069f', icon: 'sparkles' },
  { id: 'joystick', label: 'Joystick', color: '#dd0000', icon: 'joystick' },
  { id: 'crown', label: 'Mahkota', color: '#fae03c', icon: 'crown' },
  { id: 'lightning', label: 'Petir', color: '#fae03c', icon: 'lightning' },
  { id: 'gift', label: 'Pita', color: '#dd0000', icon: 'gift' },
  { id: 'sunglasses', label: 'Kacamata', color: '#000000', icon: 'sunglasses' },
];

interface StickerPickerProps {
  onAddSticker: (sticker: StickerItem) => void;
}

export default function StickerPicker({ onAddSticker }: StickerPickerProps) {
  const renderIcon = (icon: StickerItem['icon']) => {
    switch (icon) {
      case 'star': return <Star className="w-5 h-5 fill-[#fae03c] text-black" />;
      case 'heart': return <Heart className="w-5 h-5 fill-[#008dd1] text-black" />;
      case 'sparkles': return <Sparkles className="w-5 h-5 text-primary" />;
      case 'joystick': return <Gamepad2 className="w-5 h-5 text-danger" />;
      case 'crown': return <Crown className="w-5 h-5 fill-[#fae03c] text-black" />;
      case 'lightning': return <Zap className="w-5 h-5 fill-[#fae03c] text-black" />;
      case 'gift': return <Gift className="w-5 h-5 fill-[#dd0000] text-white" />;
      case 'sunglasses': return <Eye className="w-5 h-5 text-black" />;
    }
  };

  return (
    <div className="neo-box p-4 bg-surface w-full rounded-2xl">
      <div className="flex items-center gap-2 mb-3 font-chillax text-xs font-bold text-primary">
        <Smile className="w-5 h-5 text-secondary" />
        TAMBAHKAN STIKER DOODLE (CLICK TO ADD)
      </div>
      <div className="grid grid-cols-4 gap-2">
        {DOODLE_STICKERS.map((stk) => (
          <button
            key={stk.id}
            onClick={() => onAddSticker(stk)}
            className="neo-btn p-2 text-[11px] font-bold hover:bg-gray-100 hover:border-primary transition-all flex items-center justify-center gap-1.5 bg-surface"
            title={stk.label}
          >
            {renderIcon(stk.icon)}
            <span>{stk.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
