/**
 * Image post-processing effects.
 */

import { createDiffuser, type DitherFn } from "$/utils/dither";

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** ITU-R BT.601 grayscale */
export const rgbToGray = (r: number, g: number, b: number): number => {
  return r * 0.299 + g * 0.587 + b * 0.114;
};

// ─── Error-diffusion dithering ─────────────────────────────────────────────────

/** Floyd–Steinberg (4 neighbours) */
export const floydSteinberg = createDiffuser(16, [
  [0, 0, 7],
  [3, 5, 1],
]);

/** Jarvis–Judice–Ninke (12 neighbours) — 8-bit clamped buffer like ditheringstudio.com */
export const jarvisJudiceNinke = createDiffuser(48, [
  [0, 0, 0, 7, 5],
  [3, 5, 7, 5, 3],
  [1, 3, 5, 3, 1],
], { clamp: true });

/** Stucki (12 neighbours) — 8-bit clamped buffer */
export const stucki = createDiffuser(42, [
  [0, 0, 0, 8, 4],
  [2, 4, 8, 4, 2],
  [1, 2, 4, 2, 1],
], { clamp: true });

/** Burkes (7 neighbours) — 8-bit clamped buffer */
export const burkes = createDiffuser(32, [
  [0, 0, 0, 8, 4],
  [2, 4, 8, 4, 2],
], { clamp: true });

/** Sierra-3 (10 neighbours) — 8-bit clamped buffer */
export const sierra3 = createDiffuser(32, [
  [0, 0, 0, 5, 3],
  [2, 4, 5, 4, 2],
  [0, 2, 3, 2, 0],
], { clamp: true });

/** False Floyd–Steinberg (3 neighbours, simplified) — 8-bit clamped buffer */
const _falseFloyd = createDiffuser(8, [
  [0, 0, 3],
  [0, 3, 2],
], { clamp: true });

/**
 * False Floyd–Steinberg.
 *
 * The site implements this algorithm by hand without any diffusion-strength
 * control, so strength is fixed at 1 here too.
 */
export const falseFloyd: DitherFn = (image, options) =>
  _falseFloyd(image, { ...options, strength: 1 });

// Atkinson: 6 neighbours at 1/8 each.  Only 6/8 of the error is diffused
// (the remaining 2/8 is discarded), producing the characteristic bright,
// high-contrast Macintosh look.  normalize=false preserves this ratio.
// 8-bit clamped buffer; site has no serpentine variant, so scanning is
// always left-to-right.
const _atkinson = createDiffuser(8, [
  [0, 0, 0, 1, 1],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
], { normalize: false, clamp: true, defaultSerpentine: false });

/**
 * Atkinson dithering (not kernel-based — fixed 6-neighbour pattern)
 *
 * Atkinson diffuses only 6/8 of the error, producing a brighter,
 * high-contrast result characteristic of the original Macintosh.
 *
 * @param image      The imageData of a Canvas 2d context
 * @param threshold  Threshold slider (1–255), mapped to Diffusion Factor (0–2)
 */
export const atkinson = (image: ImageData, threshold: number): ImageData => {
  const factor = Math.max(0, Math.min(2, threshold / 128));
  return _atkinson(image, { threshold: 128, strength: factor });
};

// ─── Non-diffusion effects ────────────────────────────────────────────────────

/**
 * Change the image to black and white using a simple threshold
 *
 * @param  image      The imageData of a Canvas 2d context
 * @param  threshold  Threshold value (0-255)
 * @return            The resulting imageData
 */
export const threshold = (image: ImageData, threshold: number): ImageData => {
  for (let i = 0; i < image.data.length; i += 4) {
    const luminance = rgbToGray(image.data[i], image.data[i + 1], image.data[i + 2]);
    const value = luminance < threshold ? 0 : 255;
    image.data.fill(value, i, i + 3);
  }
  return image;
};

/**
 * Bayer ordered dithering
 *
 * @param image      The imageData of a Canvas 2d context
 * @param threshold  Threshold value (0-255)
 */
export const bayer = (image: ImageData, threshold: number): ImageData => {
  const src = image.data;
  const width = image.width;

  const bayerMatrix = [
    [0, 191, 48, 239, 12, 203, 60, 251],
    [128, 64, 176, 112, 140, 76, 188, 124],
    [32, 223, 16, 207, 44, 235, 28, 219],
    [160, 96, 144, 80, 172, 108, 156, 92],
    [8, 199, 56, 247, 4, 195, 52, 243],
    [136, 72, 184, 120, 132, 68, 180, 116],
    [40, 231, 24, 215, 36, 227, 20, 211],
    [168, 104, 152, 88, 164, 100, 148, 84],
  ];

  for (let i = 0; i < src.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    const gray = rgbToGray(src[i], src[i + 1], src[i + 2]);
    const bayerValue = bayerMatrix[y % 8][x % 8];
    const value = gray < threshold - bayerValue / 2 ? 0 : 255;
    src[i] = src[i + 1] = src[i + 2] = value;
  }

  return image;
};

// ─── Image transforms ─────────────────────────────────────────────────────────

/**
 * Invert image
 */
export const invert = (image: ImageData): ImageData => {
  for (let i = 0; i < image.data.length; i += 4) {
    const black = (image.data[i] + image.data[i + 1] + image.data[i + 2]) === 0;
    image.data.fill(black ? 255 : 0, i, i + 3);
  }
  return image;
};

/**
 * Mirror image horizontally
 */
export const mirror = (image: ImageData): ImageData => {
  const { width, height, data } = image;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < Math.floor(width / 2); x++) {
      const oppositeX = width - 1 - x;
      const left = (y * width + x) * 4;
      const right = (y * width + oppositeX) * 4;
      for (let c = 0; c < 4; c++) {
        const temp = data[left + c];
        data[left + c] = data[right + c];
        data[right + c] = temp;
      }
    }
  }
  return image;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

export const copyImageData = (iData: ImageData): ImageData => {
  return new ImageData(new Uint8ClampedArray(iData.data), iData.width, iData.height);
};