import { apiFetch } from "./http";
export const cloudinaryService = {
  isConfigured() { return true; },
  async uploadImage(file) {
    if (!file || !["image/jpeg", "image/png", "image/gif"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      throw new Error("Choose a PNG, JPEG, or GIF image under 10 MB.");
    }
    const form = new FormData();
    form.append("image", file);
    const result = await apiFetch("/profiles/me/images", { method: "POST", body: form });
    return result.url;
  },
};
