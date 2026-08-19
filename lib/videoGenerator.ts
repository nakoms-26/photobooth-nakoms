export interface VideoResult {
  success: boolean;
  videoUrl?: string;
  videoBlob?: Blob;
  videoBase64?: string;
  mimeType?: string;
  extension?: 'mp4' | 'webm';
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

export async function createBoomerangVideo(
  images: string[],
  frameDurationMs: number = 380,
  targetWidth: number = 480,
  targetHeight: number = 360,
  loops: number = 2
): Promise<VideoResult> {
  return new Promise(async (resolve) => {
    try {
      if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
        return resolve({ success: false, error: 'MediaRecorder tidak didukung di browser ini' });
      }

      // 1. Load images into HTMLImageElement
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

      if (loadedImages.length === 0) {
        return resolve({ success: false, error: 'Tidak ada foto untuk dibuat video' });
      }

      // 2. Select best supported MIME type
      let mimeType = 'video/webm';
      let extension: 'mp4' | 'webm' = 'webm';

      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        mimeType = 'video/mp4;codecs=avc1';
        extension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        extension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
        extension = 'webm';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
        extension = 'webm';
      }

      // 3. Create canvas for drawing
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({ success: false, error: 'Gagal membuat canvas context' });

      // 4. Setup MediaStream and Recorder (30 fps)
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);
        const videoBase64 = await blobToBase64(videoBlob);
        resolve({
          success: true,
          videoUrl,
          videoBlob,
          videoBase64,
          mimeType,
          extension,
        });
      };

      recorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        resolve({ success: false, error: 'Gagal merekam video' });
      };

      recorder.start();

      // 5. Build sequence of frames: e.g. [0, 1, 2, 1] repeated `loops` times
      const seq: number[] = [];
      for (let l = 0; l < loops; l++) {
        for (let i = 0; i < loadedImages.length; i++) seq.push(i);
        for (let i = loadedImages.length - 2; i > 0; i--) seq.push(i);
      }

      // 6. Draw each frame at interval
      let frameIndex = 0;
      const drawNextFrame = () => {
        if (frameIndex >= seq.length) {
          setTimeout(() => {
            if (recorder.state !== 'inactive') recorder.stop();
          }, 150);
          return;
        }

        const img = loadedImages[seq[frameIndex]];
        ctx.clearRect(0, 0, targetWidth, targetHeight);

        // Maintain aspect ratio cover
        const ir = img.width / img.height;
        const tr = targetWidth / targetHeight;
        let dw = targetWidth, dh = targetHeight, dx = 0, dy = 0;
        if (ir > tr) {
          dw = targetHeight * ir;
          dx = -(dw - targetWidth) / 2;
        } else {
          dh = targetWidth / ir;
          dy = -(dh - targetHeight) / 2;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
        frameIndex++;
        setTimeout(drawNextFrame, frameDurationMs);
      };

      drawNextFrame();

    } catch (err: unknown) {
      console.error('Video generation exception:', err);
      resolve({ success: false, error: 'Gagal merender video boomerang' });
    }
  });
}
