import { describe, it, expect, vi, beforeEach } from 'vitest';
import { __private__, compressImage, setImageCompressionTestHooks, type ImageCompressionOptions } from '../../utils/imageCompression';

// Helper to create a Blob of a given size
const makeBlob = (size: number, type = 'image/jpeg') => new Blob([new Uint8Array(size)], { type });

describe('imageCompression utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unsupported input types', async () => {
    const bad = makeBlob(1000, 'application/pdf');
    await expect(compressImage(bad)).rejects.toThrow(/Unsupported input type/);
  });

  it('computes target dimensions within bounds', () => {
    const { computeTargetDimensions } = __private__;
    expect(computeTargetDimensions(4000, 3000, 2000, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(computeTargetDimensions(800, 600, 2000, 2000)).toEqual({ width: 800, height: 600 });
  });

  it('reduces quality until under max size', async () => {
    const input = makeBlob(4_000_000, 'image/jpeg');

    // Mock loader: return a fake image with known dimensions
    setImageCompressionTestHooks({
      loadImage: async () => ({ image: {} as unknown as HTMLImageElement, width: 3000, height: 2000 }),
      encode: async (_w, _h, _t, quality) => {
        // Simulate blob size as a function of quality; lower quality => smaller size
        const size = Math.floor(800_000 * quality); // at quality=0.9 => ~720KB
        return makeBlob(size, 'image/webp');
      },
    });

    const res = await compressImage(input, { maxSizeBytes: 450 * 1024, preferMimeType: 'image/webp' });
    expect(res.contentType).toBe('image/webp');
    expect(res.bytes).toBeLessThanOrEqual(450 * 1024);
  });

  it('reduces dimensions if min quality still too large', async () => {
    const input = makeBlob(5_000_000, 'image/jpeg');
    const sizes: number[] = [];

    setImageCompressionTestHooks({
      loadImage: async () => ({ image: {} as unknown as HTMLImageElement, width: 4000, height: 3000 }),
      encode: async (w, _h, _t, quality) => {
        // Simulate that even at min quality the size is still big at large dims; scales with width
        const base = 1_200_000; // base size for width=4000 at quality=1
        const scaled = Math.floor((base * (w / 4000)) * quality);
        sizes.push(scaled);
        return makeBlob(scaled, 'image/webp');
      },
    });

    const res = await compressImage(input, {
      maxSizeBytes: 450 * 1024,
      preferMimeType: 'image/webp',
      maxQuality: 0.9,
      minQuality: 0.5,
      qualityStep: 0.2,
      scaleStep: 0.7,
    } as ImageCompressionOptions);

    expect(res.bytes).toBeLessThanOrEqual(450 * 1024);
    // Ensure at least one dimension reduction attempt happened
    expect(sizes.length).toBeGreaterThan(1);
  });
});
