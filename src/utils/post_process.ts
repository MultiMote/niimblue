/**
 * Image post-processing effects.
 */

import { createDiffuser, rgbToGray } from "$/utils/dither";

// ─── Error-diffusion dithering ─────────────────────────────────────────────────

/** Floyd–Steinberg (4 neighbours) */
export const floydSteinberg = createDiffuser(16, [
  [0, 0, 7],
  [3, 5, 1],
]);

/** Jarvis–Judice–Ninke (12 neighbours) */
export const jarvisJudiceNinke = createDiffuser(48, [
  [0, 0, 0, 7, 5],
  [3, 5, 7, 5, 3],
  [1, 3, 5, 3, 1],
]);

/** Stucki (12 neighbours) */
export const stucki = createDiffuser(42, [
  [0, 0, 0, 8, 4],
  [2, 4, 8, 4, 2],
  [1, 2, 4, 2, 1],
]);

/** Burkes (7 neighbours) */
export const burkes = createDiffuser(32, [
  [0, 0, 0, 8, 4],
  [2, 4, 8, 4, 2],
]);

/** Sierra-3 (10 neighbours) */
export const sierra3 = createDiffuser(32, [
  [0, 0, 0, 5, 3],
  [2, 4, 5, 4, 2],
  [0, 2, 3, 2, 0],
]);

/** False Floyd–Steinberg (3 neighbours, simplified) */
export const falseFloyd = createDiffuser(8, [
  [0, 0, 3],
  [0, 3, 2],
]);

// Atkinson: 6 neighbours at 1/8 each.  Only 6/8 of the error is diffused
// (the remaining 2/8 is discarded), producing the characteristic bright,
// high-contrast Macintosh look.  normalize=false preserves this ratio.
export const atkinson = createDiffuser(8, [
  [0, 0, 0, 1, 1],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
], { normalize: false });

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

const BAYER_MATRICES = {
  2: [
    [0, 2],
    [3, 1],
  ],
  4: [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ],
  8: [
    [0, 48, 12, 60, 3, 51, 15, 63],
    [32, 16, 44, 28, 35, 19, 47, 31],
    [8, 56, 4, 52, 11, 59, 7, 55],
    [40, 24, 36, 20, 43, 27, 39, 23],
    [2, 50, 14, 62, 1, 49, 13, 61],
    [34, 18, 46, 30, 33, 17, 45, 29],
    [10, 58, 6, 54, 9, 57, 5, 53],
    [42, 26, 38, 22, 41, 25, 37, 21],
  ],
};

/**
 * Bayer ordered dithering
 *
 * @param image       The imageData of a Canvas 2d context
 * @param patternSize Bayer matrix size (2, 4 or 8)
 */
export const bayer = (image: ImageData, patternSize: 2 | 4 | 8 = 4): ImageData => {
  const matrix = BAYER_MATRICES[patternSize];
  const scale = patternSize * patternSize;
  const { width, height, data } = image;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const threshold = ((matrix[y % patternSize][x % patternSize] + 0.5) / scale) * 255;
      const value = gray > threshold ? 255 : 0;

      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
  }

  return image;
};

// ─── Image transforms ─────────────────────────────────────────────────────────

/**
 * Invert image
 */
export const invert = (image: ImageData): ImageData => {
  for (let i = 0; i < image.data.length; i += 4) {
    const black = image.data[i] + image.data[i + 1] + image.data[i + 2] === 0;
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
