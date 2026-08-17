'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FRAME_TEMPLATES, FrameTemplate } from '@/lib/frameTemplates';
import { ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface FrameCompositorProps {
  photos: string[];
  onCompositeGenerated: (pngDataUrl: string) => void;
  actions?: React.ReactNode;
}

const TEMPLATES = FRAME_TEMPLATES.filter(t => t.photoCount === 3);
const DEFAULT_WATERMARK = 'SNAPKOMS MEMORIES';

// Renders a photo strip onto a given canvas with the given template
function renderStrip(
  canvas: HTMLCanvasElement,
  template: FrameTemplate,
  loadedImages: HTMLImageElement[],
  watermark: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx || loadedImages.length === 0) return;

  const W = 480;
  const marginX = 35;
  const photoW = W - marginX * 2;
  const photoH = photoW / (16 / 9);
  const spacing = 24;
  const headerH = 90;
  const footerH = 85;
  const startY = headerH + 15;
  const H = startY + photoH * 3 + spacing * 2 + footerH;

  canvas.width = W;
  canvas.height = H;

  // Background
  ctx.fillStyle = template.bgColor;
  ctx.fillRect(0, 0, W, H);

  // Outer border
  ctx.strokeStyle = template.borderColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  // Header
  ctx.save();
  ctx.font = 'bold 36px "Fredoka", sans-serif';
  ctx.fillStyle = template.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.fillText(template.headerText, W / 2, 50);
  ctx.restore();

  // Photos
  const photoRects: Array<{ x: number; y: number; w: number; h: number }> = [];
  loadedImages.forEach((img, idx) => {
    if (idx >= 3) return;
    const py = startY + idx * (photoH + spacing);
    photoRects.push({ x: marginX, y: py, w: photoW, h: photoH });
    ctx.save();
    ctx.beginPath();
    ctx.rect(marginX, py, photoW, photoH);
    ctx.clip();
    const ir = img.width / img.height;
    const tr = photoW / photoH;
    let dw = photoW, dh = photoH, dx = marginX, dy = py;
    if (ir > tr) { dw = photoH * ir; dx = marginX - (dw - photoW) / 2; }
    else { dh = photoW / ir; dy = py - (dh - photoH) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  });

  // Frame overlay
  if (template.drawOverlay) template.drawOverlay(ctx, W, H, photoRects);

  // Footer
  const footerY = H - 55;
  ctx.save();
  ctx.font = 'bold 20px "Fredoka", sans-serif';
  ctx.fillStyle = template.textColor;
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(watermark, W / 2, footerY);
  ctx.font = '14px "Fredoka", sans-serif';
  ctx.fillStyle = '#ffffff';
  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  ctx.fillText(`${template.footerText} - ${dateStr}`, W / 2, footerY + 28);
  ctx.restore();
}

export default function FrameCompositor({ photos, onCompositeGenerated, actions }: FrameCompositorProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  // Track swipe
  const touchStartX = useRef<number | null>(null);

  const selectedTemplate: FrameTemplate = TEMPLATES[templateIndex] ?? TEMPLATES[0];

  // Preload photos
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const imgs = await Promise.all(
        photos.map(src => new Promise<HTMLImageElement>(resolve => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.src = src;
        }))
      );
      if (mounted) setLoadedImages(imgs);
    };
    if (photos.length > 0) load();
    return () => { mounted = false; };
  }, [photos]);

  // Re-render main canvas whenever template or images change
  const renderMain = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas || loadedImages.length === 0) return;
    renderStrip(canvas, selectedTemplate, loadedImages, DEFAULT_WATERMARK);
    onCompositeGenerated(canvas.toDataURL('image/png', 1.0));
  }, [selectedTemplate, loadedImages, onCompositeGenerated]);

  useEffect(() => { renderMain(); }, [renderMain]);

  const goTo = (idx: number) => {
    soundFx.playClickSound();
    setTemplateIndex((idx + TEMPLATES.length) % TEMPLATES.length);
  };

  // Touch swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(templateIndex + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-[var(--color-background)] overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex flex-col">
          <span className="font-chillax font-black text-[var(--color-text)] text-xl tracking-wide">
            Pilih Frame
          </span>
          <span className="font-chillax text-[var(--color-text-muted)] text-sm">
            {selectedTemplate.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="font-chillax text-[var(--color-text-muted)] text-xs font-bold tracking-widest uppercase">
            {templateIndex + 1} / {TEMPLATES.length}
          </span>
        </div>
      </div>

      {/* ── CANVAS CAROUSEL ── */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0 px-16"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Left arrow */}
        <button
          onClick={() => goTo(templateIndex - 1)}
          className="absolute left-2 z-10 w-12 h-12 rounded-full bg-black/5 backdrop-blur-sm border border-black/10 flex items-center justify-center text-[var(--color-text)] hover:bg-black/10 transition-all active:scale-90"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* The canvas — takes all available height */}
        <div className="relative flex items-center justify-center h-full py-2">
          <canvas
            ref={mainCanvasRef}
            className="h-full w-auto object-contain rounded-2xl"
            style={{ maxHeight: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          />
        </div>

        {/* Right arrow */}
        <button
          onClick={() => goTo(templateIndex + 1)}
          className="absolute right-2 z-10 w-12 h-12 rounded-full bg-black/5 backdrop-blur-sm border border-black/10 flex items-center justify-center text-[var(--color-text)] hover:bg-black/10 transition-all active:scale-90"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* ── BOTTOM: dot indicators + CTA ── */}
      <div className="flex-shrink-0 flex flex-col items-center gap-4 px-6 pb-6 pt-4">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {TEMPLATES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`rounded-full transition-all duration-200 ${
                templateIndex === idx
                  ? 'w-6 h-2.5 bg-yellow-400'
                  : 'w-2.5 h-2.5 bg-black/15 hover:bg-black/25'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        {actions && <div className="w-full">{actions}</div>}
      </div>
    </div>
  );
}
