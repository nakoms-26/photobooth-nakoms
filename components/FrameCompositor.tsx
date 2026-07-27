'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FRAME_TEMPLATES, FrameTemplate } from '@/lib/frameTemplates';
import StickerPicker, { StickerItem } from './StickerPicker';
import { Palette, Wand2, Type, Trash2, RotateCw } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

export interface ActiveSticker {
  uid: string;
  iconType: StickerItem['icon'];
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export type PhotoFilter = 'normal' | 'bw' | 'vintage' | 'pop' | 'warm';

interface FrameCompositorProps {
  photos: string[];
  onCompositeGenerated: (pngDataUrl: string) => void;
  actions?: React.ReactNode;
}

export default function FrameCompositor({ photos, onCompositeGenerated, actions }: FrameCompositorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<FrameTemplate>(FRAME_TEMPLATES[0]);
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('normal');
  const [customText, setCustomText] = useState('SNAPKOMS MEMORIES');
  const [stickers, setStickers] = useState<ActiveSticker[]>([]);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [selectedStickerUid, setSelectedStickerUid] = useState<string | null>(null);

  // Preload captured photos into HTMLImageElement instances
  useEffect(() => {
    let isMounted = true;
    const loadImgs = async () => {
      const promises = photos.map((src) => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.src = src;
        });
      });
      const imgs = await Promise.all(promises);
      if (isMounted) {
        setLoadedImages(imgs);
      }
    };
    if (photos.length > 0) {
      loadImgs();
    }
    return () => {
      isMounted = false;
    };
  }, [photos]);

  // Vector Shape Canvas Drawer for Stickers
  const drawVectorSticker = (ctx: CanvasRenderingContext2D, icon: StickerItem['icon'], color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#202030';
    ctx.lineWidth = 3.5;

    if (icon === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          Math.cos((18 + i * 72) * Math.PI / 180) * 22,
          -Math.sin((18 + i * 72) * Math.PI / 180) * 22
        );
        ctx.lineTo(
          Math.cos((54 + i * 72) * Math.PI / 180) * 10,
          -Math.sin((54 + i * 72) * Math.PI / 180) * 10
        );
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (icon === 'heart') {
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.bezierCurveTo(-20, -10, -20, -25, 0, -25);
      ctx.bezierCurveTo(20, -25, 20, -10, 0, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (icon === 'crown') {
      ctx.beginPath();
      ctx.moveTo(-20, 10);
      ctx.lineTo(-24, -15);
      ctx.lineTo(-10, -5);
      ctx.lineTo(0, -22);
      ctx.lineTo(10, -5);
      ctx.lineTo(24, -15);
      ctx.lineTo(20, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (icon === 'lightning') {
      ctx.beginPath();
      ctx.moveTo(5, -22);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 22);
      ctx.lineTo(18, -2);
      ctx.lineTo(2, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Default Badge Circle
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };

  // Main Canvas Rendering Pipeline
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || loadedImages.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CANVAS_WIDTH = 480;
    const photoMarginX = 35;
    const photoWidth = CANVAS_WIDTH - (photoMarginX * 2);
    const photoHeight = photoWidth / (16 / 9); // Maintain 16:9 aspect ratio
    const photoSpacing = selectedTemplate.photoCount === 4 ? 18 : 24;
    
    const headerHeight = 90;
    const footerHeight = 85;
    const startY = headerHeight + 15;

    // Dynamically calculate canvas height based on slots
    const CANVAS_HEIGHT = startY + (photoHeight * selectedTemplate.photoCount) + (photoSpacing * (selectedTemplate.photoCount - 1)) + footerHeight;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // 1. Draw Background
    ctx.fillStyle = selectedTemplate.bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw Outer Doodle Border
    ctx.strokeStyle = selectedTemplate.borderColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);

    // 3. Draw Header Title
    ctx.save();
    ctx.font = 'bold 36px "Fredoka", sans-serif';
    ctx.fillStyle = selectedTemplate.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillText(selectedTemplate.headerText, CANVAS_WIDTH / 2, 50);
    ctx.restore();

    // 4. Calculate Photo Slot Dimensions
    const photoRects: Array<{ x: number; y: number; w: number; h: number }> = [];

    // 5. Render Photos with Filters
    loadedImages.forEach((img, idx) => {
      if (idx >= selectedTemplate.photoCount) return;

      const py = startY + idx * (photoHeight + photoSpacing);
      const px = photoMarginX;
      photoRects.push({ x: px, y: py, w: photoWidth, h: photoHeight });

      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, photoWidth, photoHeight);
      ctx.clip();

      // Apply CSS Filters to Canvas Context
      if (activeFilter === 'bw') {
        ctx.filter = 'grayscale(100%) contrast(120%)';
      } else if (activeFilter === 'vintage') {
        ctx.filter = 'sepia(60%) contrast(110%) brightness(95%)';
      } else if (activeFilter === 'pop') {
        ctx.filter = 'saturate(180%) contrast(115%)';
      } else if (activeFilter === 'warm') {
        ctx.filter = 'sepia(25%) saturate(140%) brightness(105%)';
      } else {
        ctx.filter = 'none';
      }

      // Aspect Cover Draw
      const imgRatio = img.width / img.height;
      const targetRatio = photoWidth / photoHeight;
      let drawW = photoWidth;
      let drawH = photoHeight;
      let drawX = px;
      let drawY = py;

      if (imgRatio > targetRatio) {
        drawW = photoHeight * imgRatio;
        drawX = px - (drawW - photoWidth) / 2;
      } else {
        drawH = photoWidth / imgRatio;
        drawY = py - (drawH - photoHeight) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    });

    // 6. Draw Custom Frame Overlay
    if (selectedTemplate.drawOverlay) {
      selectedTemplate.drawOverlay(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, photoRects);
    }

    // 7. Draw Footer Watermark Text & Date
    const footerY = CANVAS_HEIGHT - 55;
    ctx.save();
    ctx.font = 'bold 20px "Fredoka", sans-serif';
    ctx.fillStyle = selectedTemplate.textColor;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(customText, CANVAS_WIDTH / 2, footerY);

    ctx.font = '14px "Fredoka", sans-serif';
    ctx.fillStyle = '#ffffff';
    const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    ctx.fillText(`${selectedTemplate.footerText} - ${dateStr}`, CANVAS_WIDTH / 2, footerY + 28);
    ctx.restore();

    // 8. Render Vector Stickers
    stickers.forEach((stk) => {
      ctx.save();
      ctx.translate(stk.x, stk.y);
      ctx.rotate((stk.rotation * Math.PI) / 180);
      ctx.scale(stk.scale, stk.scale);

      // Selection outline for active sticker
      if (stk.uid === selectedStickerUid) {
        ctx.strokeStyle = '#fae03c'; // Secondary Yellow
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawVectorSticker(ctx, stk.iconType, stk.color);
      ctx.restore();
    });

    // Generate Final PNG Data URL
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    onCompositeGenerated(dataUrl);

  }, [selectedTemplate, activeFilter, customText, stickers, loadedImages, selectedStickerUid, onCompositeGenerated]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Sticker Handler
  const handleAddSticker = (item: StickerItem) => {
    soundFx.playClickSound();
    const newSticker: ActiveSticker = {
      uid: 'stk_' + Math.random().toString(36).substr(2, 9),
      iconType: item.icon,
      color: item.color,
      x: 240 + (Math.random() * 80 - 40),
      y: 600 + (Math.random() * 200 - 100),
      scale: 1,
      rotation: Math.round(Math.random() * 40 - 20),
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerUid(newSticker.uid);
  };

  const removeSticker = (uid: string) => {
    soundFx.playClickSound();
    setStickers((prev) => prev.filter((s) => s.uid !== uid));
    if (selectedStickerUid === uid) setSelectedStickerUid(null);
  };

  const rotateSticker = (uid: string) => {
    soundFx.playClickSound();
    setStickers((prev) =>
      prev.map((s) => (s.uid === uid ? { ...s, rotation: (s.rotation + 30) % 360 } : s))
    );
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-start lg:justify-center gap-8 xl:gap-12">
      
      {/* Live Canvas Preview */}
      <div className="neo-box rounded-2xl p-3 bg-surface flex flex-col items-center">
        <span className="text-xs font-extrabold uppercase text-primary mb-2 font-chillax">
          LIVE PHOTO STRIP PREVIEW (PNG)
        </span>
        <div className="border-2 border-black rounded-xl p-1 bg-surface">
          <canvas
            ref={canvasRef}
            className="h-[60vh] md:h-[75vh] w-auto object-contain rounded-lg shadow-md"
          />
        </div>
      </div>

      {/* Frame Compositor Customizer Controls */}
      <div className="w-full lg:flex-1 max-w-[800px] flex flex-col gap-4">
        
        {/* 1. Select Frame Template */}
        <div className="neo-box rounded-2xl p-4 bg-surface">
          <label className="text-xs font-extrabold uppercase text-primary mb-3 font-chillax flex items-center gap-2">
            <Palette className="w-5 h-5 text-secondary" />
            1. PILIH TEMPLATE FRAME BINGKAI
          </label>
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
            {FRAME_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  soundFx.playClickSound();
                  setSelectedTemplate(tmpl);
                }}
                className={`flex-none min-w-[140px] neo-btn p-3 text-xs text-left font-bold flex flex-col justify-between transition-colors ${
                  selectedTemplate.id === tmpl.id ? 'bg-primary text-white border-black' : 'bg-surface hover:bg-gray-100'
                }`}
              >
                <span className="whitespace-nowrap">{tmpl.name}</span>
                <span className={`text-[10px] font-normal ${selectedTemplate.id === tmpl.id ? 'text-gray-300' : 'text-gray-500'}`}>{tmpl.photoCount} Poses</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Photo Color Filters */}
        <div className="neo-box rounded-2xl p-4 bg-surface">
          <label className="text-xs font-extrabold uppercase text-primary mb-3 font-chillax flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-orange" />
            2. FILTER WARNA FOTO
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 'normal', label: 'Normal' },
              { id: 'vintage', label: 'Retro' },
              { id: 'bw', label: 'B&W' },
              { id: 'pop', label: 'Vivid' },
              { id: 'warm', label: 'Warm' },
            ].map((flt) => (
              <button
                key={flt.id}
                onClick={() => {
                  soundFx.playClickSound();
                  setActiveFilter(flt.id as PhotoFilter);
                }}
                className={`neo-btn py-2 text-[11px] font-bold transition-colors ${
                  activeFilter === flt.id ? 'bg-primary text-white border-black' : 'bg-surface hover:bg-gray-100'
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 3. Custom Text / Watermark */}
          <div className="neo-box rounded-2xl p-4 bg-surface flex flex-col justify-center">
            <label className="text-xs font-extrabold uppercase text-primary mb-3 font-chillax flex items-center gap-2">
              <Type className="w-5 h-5 text-error" />
              3. TEKS PESAN PESONA (WATERMARK)
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              maxLength={35}
              className="w-full neo-box rounded-2xl p-3 text-sm font-bold bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ketik watermark di sini..."
            />
          </div>

          {/* 4. Interactive Sticker Picker */}
          <StickerPicker onAddSticker={handleAddSticker} />
        </div>

        {/* Sticker Controls Bar (if stickers added) */}
        {stickers.length > 0 && (
          <div className="neo-box rounded-2xl p-3 bg-surface flex items-center justify-between text-xs">
            <span className="font-bold text-text">Stiker Terpasang: {stickers.length}</span>
            <div className="flex items-center gap-2">
              {selectedStickerUid && (
                <>
                  <button
                    onClick={() => rotateSticker(selectedStickerUid)}
                    className="neo-btn p-2 bg-secondary text-black"
                    title="Putar Stiker"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeSticker(selectedStickerUid)}
                    className="neo-btn p-2 bg-error text-white"
                    title="Hapus Stiker"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Optional Actions (Simpan Button) */}
        {actions && (
          <div className="mt-2">
            {actions}
          </div>
        )}

      </div>

    </div>
  );
}
