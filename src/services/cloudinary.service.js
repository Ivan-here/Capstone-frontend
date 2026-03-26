const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryService = {
  async uploadImage(file) {
    if (!file) {
      throw new Error("Please choose an image first.");
    }

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.secure_url) {
      throw new Error(data?.error?.message || "Image upload failed.");
    }

    return data.secure_url;
  },
};
