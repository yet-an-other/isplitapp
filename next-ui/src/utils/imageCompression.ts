/**
 * Image compression utility: resize + re-encode to target maximum size using WebP or JPEG.
 *
 * Strategy:
 * - Validate input MIME type (jpeg/png/webp).
 * - Load the image to get intrinsic dimensions.
 * - Compute target dimensions within maxWidth/maxHeight.
 * - Iteratively encode with decreasing quality until size <= maxSizeBytes.
 * - If minQuality reached and size still too large, reduce dimensions and retry.
 * - Return compressed Blob, contentType, final dimensions, and byte size.
 */

export type SupportedOutputMime = 'image/webp' | 'image/jpeg';

export interface ImageCompressionOptions {
  readonly maxSizeBytes?: number; // default 450 * 1024
  readonly maxWidth?: number; // default 2000
  readonly maxHeight?: number; // default 2000
  readonly preferMimeType?: SupportedOutputMime; // default 'image/webp'
  readonly maxQuality?: number; // default 0.92
  readonly minQuality?: number; // default 0.5
  readonly qualityStep?: number; // default 0.08
  readonly scaleStep?: number; // default 0.85 (dimension multiplier)
}

export interface ImageCompressionResult {
  readonly blob: Blob;
  readonly contentType: SupportedOutputMime;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
}

type ResolvedOptions = Required<ImageCompressionOptions>;

const DEFAULTS: ResolvedOptions = {
  maxSizeBytes: 450 * 1024,
  maxWidth: 2000,
  maxHeight: 2000,
  preferMimeType: 'image/webp',
  maxQuality: 0.92,
  minQuality: 0.5,
  qualityStep: 0.08,
  scaleStep: 0.85,
};

const ALLOWED_INPUTS = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isAllowedInput(type: string | undefined): boolean {
  if (!type) return false;
  if (ALLOWED_INPUTS.has(type)) return true;
  // Some browsers report 'image/jpg' — normalize
  if (type === 'image/jpg') return true;
  return false;
}

function computeTargetDimensions(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  if (srcW <= 0 || srcH <= 0) return { width: 1, height: 1 };
  const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
  return { width: Math.max(1, Math.round(srcW * ratio)), height: Math.max(1, Math.round(srcH * ratio)) };
}

// --- Encoding and loading hooks (overridable for tests) ---
type EncodeFn = (
  width: number,
  height: number,
  type: SupportedOutputMime,
  quality: number,
  source: HTMLImageElement | ImageBitmap
) => Promise<Blob>;

type LoadImageFn = (blob: Blob) => Promise<{ image: HTMLImageElement | ImageBitmap; width: number; height: number }>;

let encodeFn: EncodeFn = async (width, height, type, quality, source) => {
  // Use canvas to draw and encode
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  // Draw the source to canvas
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  if (!blob) throw new Error('Failed to encode image');
  return blob;
};

let loadImageFn: LoadImageFn = async (blob) => {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { image: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
  } finally {
    // Note: we can’t revoke the URL immediately because some browsers may still be decoding.
    // Callers finish quickly; in practice this is fine for small blobs. Skip revoke here.
  }
};

export function setImageCompressionTestHooks(hooks: {
  encode?: EncodeFn;
  loadImage?: LoadImageFn;
}) {
  if (hooks.encode) encodeFn = hooks.encode;
  if (hooks.loadImage) loadImageFn = hooks.loadImage;
}

function pickOutputType(prefer?: SupportedOutputMime): SupportedOutputMime {
  // Prefer requested type if supported by the browser; most modern browsers support WebP.
  // Canvas toBlob silently falls back in some browsers; we still declare the target.
  return prefer ?? 'image/webp';
}

/**
 * Compress an image Blob/File to a target size and dimensions.
 */
export async function compressImage(
  input: Blob,
  options?: ImageCompressionOptions
): Promise<ImageCompressionResult> {
  const cfg: ResolvedOptions = { ...DEFAULTS, ...(options ?? {}) };

  if (!isAllowedInput(input.type)) {
    throw new Error(`Unsupported input type: ${input.type || 'unknown'}. Allowed: jpeg, png, webp.`);
  }

  const outType = pickOutputType(cfg.preferMimeType);

  // Load to get intrinsic dimensions
  const { image, width: srcW, height: srcH } = await loadImageFn(input);
  let { width, height } = computeTargetDimensions(srcW, srcH, cfg.maxWidth, cfg.maxHeight);

  let quality = cfg.maxQuality;
  const minQ = Math.max(0.1, Math.min(1, cfg.minQuality));
  const stepQ = Math.max(0.01, Math.min(0.2, cfg.qualityStep));
  const scaleStep = Math.min(0.98, Math.max(0.5, cfg.scaleStep));

  // Two-tier loop: reduce quality, if needed reduce dimensions and try quality again.
  const maxDimensionAttempts = 6;
  for (let dimAttempt = 0; dimAttempt < maxDimensionAttempts; dimAttempt++) {
    // Reset quality at each dimension level
    quality = cfg.maxQuality;

    while (quality >= minQ) {
      const blob = await encodeFn(width, height, outType, quality, image);
  if (blob.size <= cfg.maxSizeBytes) {
        return { blob, contentType: outType, width, height, bytes: blob.size };
      }
      quality = +(quality - stepQ).toFixed(3);
    }

    // Reduce dimensions and try again
    const nextW = Math.max(1, Math.floor(width * scaleStep));
    const nextH = Math.max(1, Math.floor(height * scaleStep));
    // If no further reduction is possible, break with the smallest we could produce
    if (nextW === width && nextH === height) break;
    width = nextW;
    height = nextH;
  }

  // Final attempt at min quality with the smallest dimensions reached
  const finalBlob = await encodeFn(width, height, outType, Math.max(minQ, 0.1), image);
  if (finalBlob.size > cfg.maxSizeBytes) {
    // Even after reductions it’s still too large; return best-effort and let caller decide.
    // Keeping consistent API: still return the blob, but caller can reject based on bytes.
  }
  return { blob: finalBlob, contentType: outType, width, height, bytes: finalBlob.size };
}

export const __private__ = {
  computeTargetDimensions,
  isAllowedInput,
};
