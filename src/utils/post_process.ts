export const copyImageData = (iData: ImageData): ImageData => {
  return new ImageData(new Uint8ClampedArray(iData.data), iData.width, iData.height);
};

/**
 * Convert an RGB pixel to grayscale luminance using ITU-R BT.601 weights.
 * @param r red channel (0-255)
 * @param g green channel (0-255)
 * @param b blue channel (0-255)
 * @returns luminance (0-255)
 */
export const rgbToGray = (r: number, g: number, b: number): number => {
  return r * 0.299 + g * 0.587 + b * 0.114;
};

// Original code is taken from https://github.com/NielsLeenheer/CanvasDither
// (but it is has typescript definitions and Atkinson threshold)

/**
 * Change the image to blank and white using a simple threshold
 *
 *
 * @param  {object}   image         The imageData of a Canvas 2d context
 * @param  {number}   threshold     Threshold value (0-255)
 * @return {object}                 The resulting imageData
 *
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
 * Change the image to blank and white using the Atkinson algorithm
 *
 * @param  {object}   image         The imageData of a Canvas 2d context
 * @param  {number}   threshold     Threshold value (0-255)
 * @return {object}                 The resulting imageData
 *
 */
export const atkinson = (image: ImageData, threshold: number): ImageData => {
  const src = image.data;
  const width = image.width;
  const height = image.height;
  const dst = new Uint8ClampedArray(width * height);

  for (let l = 0, i = 0; i < src.length; l++, i += 4) {
    dst[l] = rgbToGray(src[i], src[i + 1], src[i + 2]);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const l = y * width + x;
      const i = l * 4;
      const value = dst[l] < threshold ? 0 : 255;
      const error = Math.floor((dst[l] - value) / 8);
      src.fill(value, i, i + 3);

      // Atkinson error diffusion to 6 neighbors, with bounds checking
      const diff = (dx: number, dy: number) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          dst[ny * width + nx] += error;
        }
      };
      diff(1, 0);   // right
      diff(2, 0);   // right two
      diff(-1, 1);  // bottom-left
      diff(0, 1);   // bottom
      diff(1, 1);   // bottom-right
      diff(0, 2);   // bottom two
    }
  }

  return image;
};

/**
 * Change the image to black and white using the Floyd–Steinberg dithering
 *
 * @param  {object}   image     The imageData of a Canvas 2d context
 * @param  {number}   threshold Threshold value (0-255)
 * @return {object}             The resulting imageData
 */
export const floydSteinberg = (image: ImageData, threshold: number): ImageData => {
  const src = image.data;
  const width = image.width;
  const height = image.height;
  const dst = new Float32Array(width * height);

  for (let l = 0, i = 0; i < src.length; l++, i += 4) {
    dst[l] = rgbToGray(src[i], src[i + 1], src[i + 2]);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const l = y * width + x;
      const i = l * 4;
      const old = dst[l];
      const value = old < threshold ? 0 : 255;
      const error = old - value;
      src.fill(value, i, i + 3);

      // Floyd–Steinberg error diffusion (weights sum to 1)
      const diff = (dx: number, dy: number, w: number) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          dst[ny * width + nx] += error * w;
        }
      };
      diff(1, 0, 7 / 16);   // right
      diff(-1, 1, 3 / 16); // bottom-left
      diff(0, 1, 5 / 16);  // bottom
      diff(1, 1, 1 / 16);  // bottom-right
    }
  }

  return image;
};

/**
 * Change the image to blank and white using the Bayer ordered dithering
 *
 * @param  {object}   image         The imageData of a Canvas 2d context
 * @param  {number}   threshold     Threshold value (0-255)
 * @return {object}                 The resulting imageData
 *
 */
export const bayer = (image: ImageData, threshold: number): ImageData => {
  const src = image.data;
  const width = image.width;

  // Pre-calculated 8x8 Bayer matrix (normalized to 0-255)
  const bayerMatrix = [
    [0, 191, 48, 239, 12, 203, 60, 251],
    [128, 64, 176, 112, 140, 76, 188, 124],
    [32, 223, 16, 207, 44, 235, 28, 219],
    [160, 96, 144, 80, 172, 108, 156, 92],
    [8, 199, 56, 247, 4, 195, 52, 243],
    [136, 72, 184, 120, 132, 68, 180, 116],
    [40, 231, 24, 215, 36, 227, 20, 211],
    [168, 104, 152, 88, 164, 100, 148, 84]
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

/**
 * Invert image
 *
 * @param  {object}   image         The imageData of a Canvas 2d context
 * @return {object}                 The resulting imageData
 *
 */
export const invert = (image: ImageData): ImageData => {
  for (let i = 0; i < image.data.length; i += 4) {
    const black = (image.data[i] + image.data[i + 1] + image.data[i + 2]) === 0;
    image.data.fill(black ? 255 : 0, i, i + 3);
  }

  return image;
};


export const mirror = (image: ImageData): ImageData => {
  const { width, height, data } = image;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < Math.floor(width / 2); x++) {
      const oppositeX = width - 1 - x;

      const left = (y * width + x) * 4;
      const right = (y * width + oppositeX) * 4;

      // Swap RGBA values
      for (let c = 0; c < 4; c++) {
        const temp = data[left + c];
        data[left + c] = data[right + c];
        data[right + c] = temp;
      }
    }
  }

  return image;
};
