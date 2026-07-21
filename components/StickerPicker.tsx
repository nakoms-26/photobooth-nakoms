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
  { id: 'star', label: 'Bintang', color: '#f8d22a', icon: 'star' },
  { id: 'heart', label: 'Hati', color: '#f28df8', icon: 'heart' },
  { id: 'sparkles', label: 'Sparkles', color: '#8e36ff', icon: 'sparkles' },
  { id: 'joystick', label: 'Joystick', color: '#ef4444', icon: 'joystick' },
  { id: 'crown', label: 'Mahkota', color: '#f8d22a', icon: 'crown' },
  { id: 'lightning', label: 'Petir', color: '#f8d22a', icon: 'lightning' },
  { id: 'gift', label: 'Pita', color: '#ef4444', icon: 'gift' },
  { id: 'sunglasses', label: 'Kacamata', color: '#202030', icon: 'sunglasses' },
];

interface StickerPickerProps {
  onAddSticker: (sticker: StickerItem) => void;
}

export default function StickerPicker({ onAddSticker }: StickerPickerProps) {
  const renderIcon = (icon: StickerItem['icon']) => {
    switch (icon) {
      case 'star': return <Star className="w-5 h-5 fill-[#f8d22a] text-[#202030]" />;
      case 'heart': return <Heart className="w-5 h-5 fill-[#f28df8] text-[#202030]" />;
      case 'sparkles': return <Sparkles className="w-5 h-5 text-[#8e36ff]" />;
      case 'joystick': return <Gamepad2 className="w-5 h-5 text-[#ef4444]" />;
      case 'crown': return <Crown className="w-5 h-5 fill-[#f8d22a] text-[#202030]" />;
      case 'lightning': return <Zap className="w-5 h-5 fill-[#f8d22a] text-[#202030]" />;
      case 'gift': return <Gift className="w-5 h-5 fill-[#ef4444] text-[#ffffff]" />;
      case 'sunglasses': return <Eye className="w-5 h-5 text-[#202030]" />;
    }
  };

  return (
    <div className="neo-box p-3 bg-[#ffffff] w-full">
      <div className="flex items-center gap-1.5 mb-2 font-chillax text-xs font-bold text-[#8e36ff]">
        <Smile className="w-4 h-4 text-[#f8d22a]" />
        TAMBAHKAN STIKER DOODLE (CLICK TO ADD)
      </div>
      <div className="grid grid-cols-4 gap-2">
        {DOODLE_STICKERS.map((stk) => (
          <button
            key={stk.id}
            onClick={() => onAddSticker(stk)}
            className="neo-btn p-2 text-xs font-bold hover:bg-[#8e36ff]/10 hover:border-[#8e36ff] transition-all flex items-center justify-center gap-1.5 bg-[#faf8ff]"
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
