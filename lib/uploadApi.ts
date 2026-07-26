export const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

export const uploadAsset = async (dataUrl: string, type: 'png' | 'gif'): Promise<string | null> => {
  try {
    const filename = `snapkoms-${Date.now()}.${type}`;
    const file = dataURLtoFile(dataUrl, filename);
    
    const formData = new FormData();
    formData.append("app", "photobooth"); 
    formData.append("file", file);

    // Call our internal API route which securely handles the secret and external URL via env variables
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    const result = await response.json();
    if (result.success) {
      return result.url;
    } else {
      console.error("Gagal upload:", result.error);
      return null;
    }
  } catch (error) {
    console.error("Network Error:", error);
    return null;
  }
};
