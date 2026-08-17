export interface FrameTemplate {
  id: string;
  name: string;
  description: string;
  photoCount: 3;

  // Custom drawn template props (optional)
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  accentColor?: string;
  headerText?: string;
  footerText?: string;
  drawOverlay?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    photoRects: Array<{ x: number; y: number; w: number; h: number }>,
  ) => void;

  // Image-based template props (optional)
  isImageFrame?: boolean;
  frameUrl?: string; // Path ke file PNG
  canvasWidth?: number; // Lebar file PNG
  canvasHeight?: number; // Tinggi file PNG
  photoRects?: Array<{ x: number; y: number; w: number; h: number }>; // Kordinat lubang foto
}

/* 
  PANDUAN MENGATUR LAYOUT TWIBBON:
  1. canvasWidth & canvasHeight harus sesuai dengan dimensi resolusi file PNG (contoh: 1080x1920).
  2. photoRects adalah area kosong/transparan tempat foto akan dimasukkan.
     - x: posisi dari kiri
     - y: posisi dari atas
     - w: lebar foto
     - h: tinggi foto
  Anda bisa mengatur koordinat (x,y,w,h) sesuai dengan lubang frame pada setiap layout.
*/

// Layout 1 (twibbon/1) - Silakan sesuaikan koordinat x, y, w, h
const LAYOUT_1_RECTS = [
  { x: 93, y: 327, w: 967, h: 767 }, // Foto 1
  { x: 93, y: 1201, w: 967, h: 767 }, // Foto 2
  { x: 93, y: 2074, w: 967, h: 768 }, // Foto 3
];
// Layout 2 (twibbon/2) - Silakan sesuaikan koordinat x, y, w, h
const LAYOUT_2_RECTS = [
  { x: 91, y: 1201, w: 978, h: 663 }, // Foto 1
  { x: 91, y: 1932, w: 978, h: 664 }, // Foto 2
  { x: 91, y: 2664, w: 978, h: 664 }, // Foto 3
];

export const FRAME_TEMPLATES: FrameTemplate[] = [
  // --- Kumpulan Frame Layout 1 ---
  ...["f1", "f6", "f7", "f8", "f9", "f10", "f11", "f12"].map((id, index) => ({
    id: `twibbon-1-${id}`,
    name: `Layout 1 - Mode ${index + 1}`,
    description: `Frame ${id}.png dari folder twibbon/1`,
    photoCount: 3 as const,
    isImageFrame: true,
    frameUrl: `/twibbon/1/${id}.png`,
    canvasWidth: 1153,
    canvasHeight: 3457,
    photoRects: LAYOUT_1_RECTS,
  })),

  // --- Kumpulan Frame Layout 2 ---
  ...["f2", "f3", "f4", "f5"].map((id, index) => ({
    id: `twibbon-2-${id}`,
    name: `Layout 2 - Mode ${index + 1}`,
    description: `Frame ${id}.png dari folder twibbon/2`,
    photoCount: 3 as const,
    isImageFrame: true,
    frameUrl: `/twibbon/2/${id}.png`,
    canvasWidth: 1153,
    canvasHeight: 3457,
    photoRects: LAYOUT_2_RECTS,
  })),
];
