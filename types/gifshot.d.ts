declare module 'gifshot' {
  interface GifOptions {
    images?: string[];
    video?: string[];
    interval?: number;
    gifWidth?: number;
    gifHeight?: number;
    numFrames?: number;
    frameDuration?: number;
    sampleInterval?: number;
    numWorkers?: number;
    filter?: string;
  }

  interface GifCallbackResult {
    error: boolean;
    errorCode: string;
    errorMsg: string;
    image: string;
  }

  function createGIF(
    options: GifOptions,
    callback: (obj: GifCallbackResult) => void
  ): void;

  function isSupported(): boolean;

  export default {
    createGIF,
    isSupported,
  };
}
