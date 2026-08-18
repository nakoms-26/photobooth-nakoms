export const uploadSession = async (
  pngBase64: string,
  gifBase64: string,
  rawPhotos: string[] = []
): Promise<string | null> => {
  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pngBase64,
        gifBase64,
        rawPhotos,
      }),
    });
    
    const result = await response.json();
    if (result.success) {
      return result.id; // Return the database session ID
    } else {
      console.error("Gagal upload:", result.error);
      return null;
    }
  } catch (error) {
    console.error("Network Error:", error);
    return null;
  }
};

