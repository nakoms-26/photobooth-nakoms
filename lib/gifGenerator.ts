import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export interface GifResult {
  success: boolean;
  gifUrl?: string;
  gifBase64?: string;
  gifBlob?: Blob;
  error?: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Super fast CSR GIF generation using gifenc (~100-200ms at Max Resolution)
 */
export async function createAnimatedGif(
  images: string[],
  delayMs: number = 380,
  targetWidth: number = 640,
  targetHeight: number = 480
): Promise<GifResult> {
  try {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Browser environment required' };
    }

    if (images.length === 0) {
      return { success: false, error: 'Tidak ada foto untuk dibuat GIF' };
    }

    // 1. Preload all images
    const loadedImages: HTMLImageElement[] = await Promise.all(
      images.map((src) => {
        return new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = (e) => rej(e);
          img.src = src;
        });
      })
    );

    // 2. Offscreen canvas for frame extraction
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { success: false, error: 'Gagal membuat canvas context' };
    }

    const gif = GIFEncoder();

    // 3. Boomerang frame sequence: 0 -> 1 -> 2 -> 1 (or 0 -> 1 -> 2 -> 1 -> 0 -> 1 -> 2)
    const seq = [0, 1, 2, 1];

    for (let i = 0; i < seq.length; i++) {
      const img = loadedImages[seq[i]];
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Aspect ratio cover
      const ir = img.width / img.height;
      const tr = targetWidth / targetHeight;
      let dw = targetWidth,
        dh = targetHeight,
        dx = 0,
        dy = 0;
      if (ir > tr) {
        dw = targetHeight * ir;
        dx = -(dw - targetWidth) / 2;
      } else {
        dh = targetWidth / ir;
        dy = -(dh - targetHeight) / 2;
      }

      ctx.drawImage(img, dx, dy, dw, dh);
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const rgba = new Uint8Array(imgData.data.buffer);

      // Fast color quantization & palette application
      const palette = quantize(rgba, 256, { format: 'rgba4444' });
      const index = applyPalette(rgba, palette, 'rgba4444');

      gif.writeFrame(index, targetWidth, targetHeight, {
        palette,
        delay: delayMs,
        repeat: 0, // Infinite loop
      });
    }

    gif.finish();

    const bytes = gif.bytes();
    const gifBlob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
    const gifUrl = URL.createObjectURL(gifBlob);
    const gifBase64 = await blobToBase64(gifBlob);

    return {
      success: true,
      gifUrl,
      gifBlob,
      gifBase64,
    };
  } catch (err: unknown) {
    console.error('GIF generation error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal membuat animasi GIF',
    };
  }
}
