export interface InitialUploadResponse {
  success: boolean;
  id?: string;
  pngUrl?: string;
  photo1Url?: string | null;
  photo2Url?: string | null;
  photo3Url?: string | null;
  error?: string;
}

export interface GifUploadResponse {
  success: boolean;
  gifUrl?: string;
  error?: string;
}

export const uploadInitialSession = async (
  sessionId: string,
  pngBase64: string,
  rawPhotos: string[] = [],
  onProgress?: (percent: number) => void
): Promise<InitialUploadResponse> => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.setRequestHeader("Content-Type", "application/json");

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result);
        } catch (error) {
          console.error("Failed to parse initial upload response:", error);
          resolve({ success: false, error: "Gagal memproses respons server" });
        }
      } else {
        // Read the body to get the actual server error message
        let serverError = xhr.statusText;
        try {
          const errBody = JSON.parse(xhr.responseText);
          serverError = errBody.error || errBody.details || xhr.statusText;
          console.error("[uploadInitialSession] Server error body:", errBody);
        } catch {
          console.error("[uploadInitialSession] Server error (non-JSON):", xhr.responseText?.substring(0, 300));
        }
        resolve({ success: false, error: `HTTP ${xhr.status}: ${serverError}` });
      }
    };

    xhr.onerror = () => {
      console.error("Network Error during initial upload");
      resolve({ success: false, error: "Kesalahan jaringan saat upload foto" });
    };

    xhr.send(JSON.stringify({
      action: 'initial',
      sessionId,
      pngBase64,
      rawPhotos,
    }));
  });
};

export interface VideoUploadResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

export const uploadVideoSession = async (
  sessionId: string,
  videoBase64: string,
  extension: string = 'mp4'
): Promise<VideoUploadResponse> => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result);
        } catch (error) {
          console.error("Failed to parse Video upload response:", error);
          resolve({ success: false, error: "Gagal memproses respons server Video" });
        }
      } else {
        let serverError = xhr.statusText;
        try {
          const errBody = JSON.parse(xhr.responseText);
          serverError = errBody.error || errBody.details || xhr.statusText;
          console.error("[uploadVideoSession] Server error body:", errBody);
        } catch {
          console.error("[uploadVideoSession] Server error (non-JSON):", xhr.responseText?.substring(0, 300));
        }
        resolve({ success: false, error: `HTTP ${xhr.status}: ${serverError}` });
      }
    };

    xhr.onerror = () => {
      console.error("Network Error during Video upload");
      resolve({ success: false, error: "Kesalahan jaringan saat upload Video" });
    };

    xhr.send(JSON.stringify({
      action: 'upload-video',
      sessionId,
      videoBase64,
      extension,
    }));
  });
};

export const uploadGifSession = uploadVideoSession;

export const uploadSession = async (
  pngBase64: string,
  gifBase64: string,
  rawPhotos: string[] = [],
  onProgress?: (percent: number) => void
): Promise<string | null> => {
  const sessionId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  const initialRes = await uploadInitialSession(sessionId, pngBase64, rawPhotos, onProgress);
  if (!initialRes.success || !initialRes.id) {
    return null;
  }
  if (gifBase64) {
    uploadGifSession(initialRes.id, gifBase64).catch((err) => console.error("GIF upload async error:", err));
  }
  return initialRes.id;
};


