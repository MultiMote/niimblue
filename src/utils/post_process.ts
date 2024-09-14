export const copyImageData = (iData: ImageData): ImageData => {
  return new ImageData(new Uint8ClampedArray(iData.data), iData.width, iData.height);
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
    const luminance = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
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
