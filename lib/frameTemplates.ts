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
    id: 'nakoms-primary',
    name: 'Nakoms Classic',
    description: 'Clean modern frame with primary blue accents',
    bgColor: '#10069f',
    borderColor: '#000000',
    textColor: '#ffffff',
    accentColor: '#fae03c',
    photoCount: 4,
    theme: 'arcade-blue',
    headerText: 'SNAPKOMS',
    footerText: 'DIGITAL PHOTOBOOTH',
    drawOverlay: (ctx, width, height, photoRects) => {
      photoRects.forEach((rect) => {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      });
      ctx.fillStyle = '#fae03c';
      [{ x: 28, y: 38 }, { x: width - 28, y: 38 }, { x: 28, y: height - 38 }, { x: width - 28, y: height - 38 }].forEach(pos => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  },
  {
    id: 'snapkoms-navy',
    name: 'Snapkoms Navy',
    description: 'Deep Navy Frame with yellow stars & retro doodle badges',
    bgColor: '#001f67',
    borderColor: '#000000',
    textColor: '#fae03c',
    accentColor: '#008dd1',
    photoCount: 4,
    theme: 'arcade-blue',
    headerText: 'SNAPKOMS',
    footerText: 'NAKOMS PHOTOBOOTH',
    drawOverlay: (ctx, width, height, photoRects) => {
      const drawStar = (cx: number, cy: number, r: number) => {
        ctx.save();
        ctx.fillStyle = '#fae03c';
        ctx.strokeStyle = '#000000';
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

      photoRects.forEach((rect) => {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      });
    }
  },
  {
    id: 'danger-booth',
    name: 'Danger Awning',
    description: 'Red & White awning stripes with lively booth badges',
    bgColor: '#ffffff',
    borderColor: '#dd0000',
    textColor: '#10069f',
    accentColor: '#fae03c',
    photoCount: 4,
    theme: 'carnival-red',
    headerText: 'CARNIVAL SNAP',
    footerText: 'MEMORIES EST. 2026',
    drawOverlay: (ctx, width, height, photoRects) => {
      ctx.save();
      const awningHeight = 55;
      const stripeWidth = 25;
      for (let x = 0; x < width; x += stripeWidth) {
        ctx.fillStyle = (Math.floor(x / stripeWidth) % 2 === 0) ? '#dd0000' : '#ffffff';
        ctx.fillRect(x, 0, stripeWidth, awningHeight);
      }
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, awningHeight, width, 4);
      ctx.restore();

      photoRects.forEach((rect) => {
        ctx.strokeStyle = '#dd0000';
        ctx.lineWidth = 5;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      });
    }
  },
  {
    id: 'starry-sky',
    name: 'Starry Sky',
    description: 'Sky Blue with cute doodle stars and candy decorations',
    bgColor: '#008dd1',
    borderColor: '#000000',
    textColor: '#ffffff',
    accentColor: '#fae03c',
    photoCount: 3,
    theme: 'starry-pink',
    headerText: 'SKY SKETCH',
    footerText: 'PURE JOY & MAGIC',
    drawOverlay: (ctx, width, height, photoRects) => {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 12; i++) {
        const x = (i * 70 + 20) % width;
        const y = 30 + (i * 90) % (height - 60);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      photoRects.forEach((rect) => {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
      });
    }
  },
  {
    id: 'pop-yellow',
    name: 'Vivid Pop Yellow',
    description: 'Bright Yellow energetic frame with comic doodles',
    bgColor: '#fae03c',
    borderColor: '#000000',
    textColor: '#10069f',
    accentColor: '#ff7900',
    photoCount: 3,
    theme: 'pop-yellow',
    headerText: 'BOOTH SHOT',
    footerText: 'SUPER POP FUN',
    drawOverlay: (ctx, width, height, photoRects) => {
      photoRects.forEach((rect) => {
        ctx.strokeStyle = '#10069f';
        ctx.lineWidth = 5;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      });
    }
  }
];
