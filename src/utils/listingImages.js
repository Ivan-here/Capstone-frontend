const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export const LISTING_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const LISTING_MAX_UPLOAD_BYTES = 95 * 1024 * 1024;

export function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not prepare image for upload."));
        }, type, quality);
    });
}

async function loadImage(file) {
    const objectUrl = URL.createObjectURL(file);

    try {
        const image = new Image();
        image.src = objectUrl;

        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error(`Could not read ${file.name || "image"}.`));
        });

        return image;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

export async function compressListingImage(file) {
    if (!(file instanceof File) || !file.type.startsWith("image/")) {
        return file;
    }

    const image = await loadImage(file);
    const largestEdge = Math.max(image.width, image.height);
    const scale = largestEdge > MAX_IMAGE_EDGE ? MAX_IMAGE_EDGE / largestEdge : 1;
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await canvasToBlob(canvas, outputType, outputType === "image/jpeg" ? JPEG_QUALITY : undefined);

    if (blob.size >= file.size && file.size <= LISTING_MAX_FILE_BYTES) {
        return file;
    }

    const extension = outputType === "image/png" ? "png" : "jpg";
    const baseName = (file.name || "listing-image").replace(/\.[^.]+$/, "");

    return new File([blob], `${baseName}.${extension}`, {
        type: outputType,
        lastModified: Date.now()
    });
}

export async function prepareListingImages(files) {
    const prepared = await Promise.all(files.map(compressListingImage));
    const oversized = prepared.find((file) => file.size > LISTING_MAX_FILE_BYTES);

    if (oversized) {
        throw new Error(`${oversized.name || "An image"} is ${formatBytes(oversized.size)}. Please use images under ${formatBytes(LISTING_MAX_FILE_BYTES)} each.`);
    }

    const totalBytes = prepared.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > LISTING_MAX_UPLOAD_BYTES) {
        throw new Error(`The selected images total ${formatBytes(totalBytes)}. Please keep listing uploads under ${formatBytes(LISTING_MAX_UPLOAD_BYTES)}.`);
    }

    return prepared;
}
