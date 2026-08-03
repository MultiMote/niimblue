export const copyImageData = (iData: ImageData): ImageData => {
  return new ImageData(new Uint8ClampedArray(iData.data), iData.width, iData.height);
};

// Original code is taken from https://github.com/NielsLeenheer/CanvasDither
// (but it is has typescript definitions and Atkinson threshold)

/**
 * Convert the image to black and white using the Atkinson algorithm
 *
 * @param  image         The imageData of a Canvas 2d context
 * @param  threshold     Threshold value (0-255)
 * @return               The resulting imageData
 *
 */
export const threshold = (image: ImageData, threshold: number): ImageData => {
  for (let i = 0; i < image.data.length; i += 4) {
    const luminance = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
    const value = luminance < threshold ? 0 : 255;
    image.data.fill(value, i, i + 3);
  }

  return image;
};

/**
 * Convert the image to black and white using the Atkinson algorithm
 *
 * @param  image         The imageData of a Canvas 2d context
 * @param  threshold     Threshold value (0-255)
 * @return               The resulting imageData
 *
 */
export const atkinson = (image: ImageData, threshold: number): ImageData => {
  const src = image.data;
  const dst = new Uint8ClampedArray(image.width * image.height);

  for (let l = 0, i = 0; i < src.length; l++, i += 4) {
    dst[l] = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114;
  }

  for (let l = 0, i = 0; i < src.length; l++, i += 4) {
    const value = dst[l] < threshold ? 0 : 255;
    const error = Math.floor((dst[l] - value) / 8);
    src.fill(value, i, i + 3);

    dst[l + 1] += error;
    dst[l + 2] += error;
    dst[l + image.width - 1] += error;
    dst[l + image.width] += error;
    dst[l + image.width + 1] += error;
    dst[l + 2 * image.width] += error;
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
 * Convert the image to black and white using the Bayer algorithm
 *
 * @param  image         The imageData of a Canvas 2d context
 * @param  patternSize   The imageData of a Canvas 2d context
 * @return               The resulting imageData
 *
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

/**
 * Invert image
 *
 * @param  image         The imageData of a Canvas 2d context
 * @return               The resulting imageData
 *
 */
export const invert = (image: ImageData): ImageData => {
  for (let i = 0; i < image.data.length; i += 4) {
    const black = image.data[i] + image.data[i + 1] + image.data[i + 2] === 0;
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
