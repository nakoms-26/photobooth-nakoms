export interface FrameTemplate {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  photoCount: 3 | 4;
  theme: 'arcade-blue' | 'carnival-red' | 'starry-pink' | 'pop-yellow';
  headerText: string;
  footerText: string;
  drawOverlay?: (ctx: CanvasRenderingContext2D, width: number, height: number, photoRects: Array<{x: number, y: number, w: number, h: number}>) => void;
}

export const FRAME_TEMPLATES: FrameTemplate[] = [
  {
    id: 'sketchie-arcade',
    name: 'Sketchie Arcade 🕹️',
    description: 'Electric Blue Arcade Frame with yellow stars & retro doodle badges',
    bgColor: '#1B52D8',
    borderColor: '#1A1325',
    textColor: '#FFE01B',
    accentColor: '#E52528',
    photoCount: 4,
    theme: 'arcade-blue',
    headerText: 'SKETCHIE BOX',
    footerText: '★ ARCADE PHOTOBOOTH ★',
    drawOverlay: (ctx, width, height, photoRects) => {
      // Draw Yellow Stars
      const drawStar = (cx: number, cy: number, r: number) => {
        ctx.save();
        ctx.fillStyle = '#FFE01B';
        ctx.strokeStyle = '#1A1325';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            cx + r * Math.cos((18 + i * 72) * Math.PI / 180),
            cy - r * Math.sin((18 + i * 72) * Math.PI / 180)
          );
          ctx.lineTo(
            cx + (r / 2) * Math.cos((54 + i * 72) * Math.PI / 180),
            cy - (r / 2) * Math.sin((54 + i * 72) * Math.PI / 180)
          );
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };

      drawStar(35, 45, 16);
      drawStar(width - 35, 45, 16);
      drawStar(30, height - 40, 14);
      drawStar(width - 30, height - 40, 14);

      // Draw cute photo slot frames
      photoRects.forEach((rect) => {
        ctx.strokeStyle = '#1A1325';
        ctx.lineWidth = 4;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      });
    }
  },
  {
    id: 'carnival-booth',
    name: 'Carnival Awning 🎪',
    description: 'Red & White awning stripes with lively booth badges',
    bgColor: '#FFFFFF',
    borderColor: '#E52528',
    textColor: '#1B52D8',
    accentColor: '#FFE01B',
    photoCount: 4,
    theme: 'carnival-red',
    headerText: 'CARNIVAL SNAP',
    footerText: 'MEMORIES • EST. 2026',
    drawOverlay: (ctx, width, height, photoRects) => {
      // Top Awning Stripes
      ctx.save();
      const awningHeight = 55;
      const stripeWidth = 25;
      for (let x = 0; x < width; x += stripeWidth) {
        ctx.fillStyle = (Math.floor(x / stripeWidth) % 2 === 0) ? '#E52528' : '#FFFFFF';
        ctx.fillRect(x, 0, stripeWidth, awningHeight);
      }
      // Awning scalloped bottom
      ctx.fillStyle = '#1A1325';
      ctx.fillRect(0, awningHeight, width, 4);
      ctx.restore();

      photoRects.forEach((rect) => {
        ctx.strokeStyle = '#E52528';
        ctx.lineWidth = 5;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      });
    }
  },
  {
    id: 'starry-pink',
    name: 'Starry Candy 🍬',
    description: 'Soft Pink Pastel with cute doodle stars and candy decorations',
    bgColor: '#F3A3C7',
    borderColor: '#1A1325',
    textColor: '#FFFFFF',
    accentColor: '#FFE01B',
    photoCount: 3,
    theme: 'starry-pink',
    headerText: 'SWEET SKETCH',
    footerText: 'PURE JOY & MAGIC ✨',
    drawOverlay: (ctx, width, height, photoRects) => {
      // Draw Candies and Dots
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 12; i++) {
        const x = (i * 70 + 20) % width;
        const y = 30 + (i * 90) % (height - 60);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      photoRects.forEach((rect) => {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = '#1A1325';
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
      });
    }
  },
  {
    id: 'pop-yellow',
    name: 'Vivid Pop Yellow ⚡',
    description: 'Bright Yellow energetic frame with comic doodles',
    bgColor: '#FFE01B',
    borderColor: '#1A1325',
    textColor: '#1B52D8',
    accentColor: '#E52528',
    photoCount: 3,
    theme: 'pop-yellow',
    headerText: 'BOOTH SHOT!',
    footerText: '⚡ SUPER POP FUN ⚡',
    drawOverlay: (ctx, width, height, photoRects) => {
      // Corner Comic Brackets
      ctx.strokeStyle = '#1A1325';
      ctx.lineWidth = 5;

      photoRects.forEach((rect) => {
        ctx.strokeStyle = '#1B52D8';
        ctx.lineWidth = 5;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      });
    }
  }
];
