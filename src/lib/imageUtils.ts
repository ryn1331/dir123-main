/**
 * Client-side image processing & WebP conversion
 * - Resizes to max 1200px
 * - Optionally letterboxes to a uniform aspect ratio (no cropping)
 * - Converts to WebP with quality control
 * - Keeps output under ~300 KB
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg";
  /** Force final aspect ratio (width/height). Image is letterboxed with background, never cropped. */
  targetAspect?: number;
  /** Background color used when letterboxing (default = warm off-white matching brand). */
  background?: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<{ blob: Blob; width: number; height: number }> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    format = "webp",
    targetAspect,
    background = "#faf8f4",
  } = options;

  const img = await loadImage(file);

  let srcW = img.width;
  let srcH = img.height;

  if (srcW > maxWidth || srcH > maxHeight) {
    const ratio = Math.min(maxWidth / srcW, maxHeight / srcH);
    srcW = Math.round(srcW * ratio);
    srcH = Math.round(srcH * ratio);
  }

  let canvasW = srcW;
  let canvasH = srcH;
  let drawX = 0;
  let drawY = 0;
  let drawW = srcW;
  let drawH = srcH;

  if (targetAspect) {
    const srcAspect = srcW / srcH;
    if (srcAspect > targetAspect) {
      canvasW = srcW;
      canvasH = Math.round(srcW / targetAspect);
    } else {
      canvasH = srcH;
      canvasW = Math.round(srcH * targetAspect);
    }
    if (canvasW > maxWidth || canvasH > maxHeight) {
      const ratio = Math.min(maxWidth / canvasW, maxHeight / canvasH);
      canvasW = Math.round(canvasW * ratio);
      canvasH = Math.round(canvasH * ratio);
      drawW = Math.round(srcW * ratio);
      drawH = Math.round(srcH * ratio);
    }
    drawX = Math.round((canvasW - drawW) / 2);
    drawY = Math.round((canvasH - drawH) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext("2d")!;
  if (targetAspect) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  const mimeType = format === "webp" ? "image/webp" : "image/jpeg";

  let currentQuality = quality;
  let blob: Blob;
  do {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), mimeType, currentQuality);
    });
    currentQuality -= 0.08;
  } while (blob.size > 300 * 1024 && currentQuality > 0.3);

  return { blob, width: canvasW, height: canvasH };
}

export async function compressThumbnail(file: File): Promise<Blob> {
  const { blob } = await compressImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.7,
    format: "webp",
  });
  return blob;
}

/**
 * Standard product photo preset — 3:4 portrait letterboxed on warm off-white.
 * Guarantees every storefront thumbnail has the same shape, no cropping.
 */
export async function compressProductPhoto(file: File): Promise<Blob> {
  const { blob } = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.85,
    format: "webp",
    targetAspect: 3 / 4,
    background: "#faf8f4",
  });
  return blob;
}
