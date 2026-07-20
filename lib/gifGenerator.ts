import gifshot from 'gifshot';

export interface GifResult {
  success: boolean;
  gifUrl?: string;
  error?: string;
}

export function createAnimatedGif(
  images: string[],
  intervalSeconds: number = 0.5,
  width: number = 400,
  height: number = 300
): Promise<GifResult> {
  return new Promise((resolve) => {
    try {
      gifshot.createGIF(
        {
          images: images,
          interval: intervalSeconds,
          gifWidth: width,
          gifHeight: height,
          numFrames: images.length,
          sampleInterval: 10,
          numWorkers: 2,
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
