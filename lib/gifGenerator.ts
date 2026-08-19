import gifshot from 'gifshot';

export interface GifResult {
  success: boolean;
  gifUrl?: string;
  error?: string;
}

export function createAnimatedGif(
  images: string[],
  intervalSeconds: number = 0.45,
  width: number = 480,
  height: number = 360
): Promise<GifResult> {
  return new Promise((resolve) => {
    try {
      const workers = typeof navigator !== 'undefined' 
        ? Math.max(2, Math.min(navigator.hardwareConcurrency || 4, 8)) 
        : 4;

      gifshot.createGIF(
        {
          images: images,
          interval: intervalSeconds,
          gifWidth: width,
          gifHeight: height,
          numFrames: images.length,
          sampleInterval: 15, // Lebih cepat 2-3x dibanding default (10) tanpa mengurangi kualitas visual
          numWorkers: workers, // Maksimalkan core CPU perangkat
        },
        (obj: { error: boolean; errorCode: string; errorMsg: string; image: string }) => {
          if (!obj.error) {
            resolve({ success: true, gifUrl: obj.image });
          } else {
            resolve({ success: false, error: obj.errorMsg || 'Gagal membuat GIF' });
          }
        }
      );
    } catch (err: unknown) {
      console.error('GIF generation exception:', err);
      resolve({ success: false, error: 'Terjadi kesalahan sistem saat membuat GIF' });
    }
  });
}
