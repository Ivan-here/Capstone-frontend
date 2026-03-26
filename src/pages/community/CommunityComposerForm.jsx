import React, { useMemo, useState } from "react";
import { cloudinaryService } from "../../services/cloudinary.service";
import { normalizeTagsInput } from "./community.utils";

const EMPTY_FORM = {
  title: "",
  content: "",
  imageUrl: "",
  tags: "",
  visibility: "PUBLIC",
};

export default function CommunityComposerForm({
  initialValues,
  submitLabel = "Post",
  busy = false,
  error = "",
  onSubmit,
}) {
  const initial = useMemo(() => ({ ...EMPTY_FORM, ...(initialValues || {}) }), [initialValues]);
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadError("");
      setUploading(true);
      const imageUrl = await cloudinaryService.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl }));
    } catch (e) {
      setUploadError(e.message || "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit?.({
      ...form,
      tags: normalizeTagsInput(form.tags),
    });
  };

  return (
    <form className="community-composer" onSubmit={handleSubmit}>
      <div className="community-form-grid">
        <label className="community-field community-field--full">
          <span className="community-field-label">Title</span>
          <input
            className="community-input"
            value={form.title}
            onChange={(event) => handleChange("title", event.target.value)}
            placeholder="Post title"
            required
          />
        </label>

        <label className="community-field community-field--full">
          <span className="community-field-label">Content</span>
          <textarea
            className="community-textarea"
            value={form.content}
            onChange={(event) => handleChange("content", event.target.value)}
            placeholder="Write your post..."
            required
          />
        </label>

        <label className="community-field">
          <span className="community-field-label">Visibility</span>
          <select
            className="community-input"
            value={form.visibility}
            onChange={(event) => handleChange("visibility", event.target.value)}
          >
            <option value="PUBLIC">Public</option>
            <option value="FOLLOWING_ONLY">Following only</option>
          </select>
        </label>

        <label className="community-field">
          <span className="community-field-label">Tags</span>
          <input
            className="community-input"
            value={form.tags}
            onChange={(event) => handleChange("tags", event.target.value)}
            placeholder="farmers, produce, giveaway"
          />
        </label>

        <div className="community-field community-field--full">
          <span className="community-field-label">Photo</span>
          <div className="community-upload-row">
            <label className="community-secondary-btn community-upload-btn">
              {uploading ? "Uploading..." : "Upload from computer"}
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploading} />
            </label>
            {form.imageUrl && (
              <button
                type="button"
                className="community-secondary-btn"
                onClick={() => handleChange("imageUrl", "")}
              >
                Remove image
              </button>
            )}
          </div>
          {uploadError && <div className="community-inline-error">{uploadError}</div>}
          {form.imageUrl && (
            <div className="community-image-preview-wrap">
              <img src={form.imageUrl} alt="Preview" className="community-image-preview" />
            </div>
          )}
        </div>
      </div>

      {error && <div className="community-inline-error">{error}</div>}

      <div className="community-actions-row">
        <button className="community-primary-btn" type="submit" disabled={busy || uploading}>
          {busy ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
