export const uploadSession = async (
  pngBase64: string,
  gifBase64: string,
  rawPhotos: string[] = [],
  onProgress?: (percent: number) => void
): Promise<string | null> => {
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
          if (result.success) {
            resolve(result.id);
          } else {
            console.error("Gagal upload:", result.error);
            resolve(null);
          }
        } catch (error) {
          console.error("Failed to parse response:", error);
          resolve(null);
        }
      } else {
        console.error("Server error:", xhr.statusText);
        resolve(null);
      }
    };

    xhr.onerror = () => {
      console.error("Network Error during upload");
      resolve(null);
    };

    xhr.send(JSON.stringify({
      pngBase64,
      gifBase64,
      rawPhotos,
    }));
  });
};

