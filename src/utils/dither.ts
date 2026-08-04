export type DitherOptions = {
  /** Binary threshold. 0→white, 128→standard, 255→black */
  threshold?: number;
  /** Diffusion strength. 0→none, 1→standard, >1→stronger */
  strength?: number;
  /** Serpentine (bidirectional) scanning */
  serpentine?: boolean;
};

export type DitherFn = (image: ImageData, options?: DitherOptions) => ImageData;

export const rgbToGray = (r: number, g: number, b: number): number => r * 0.299 + g * 0.587 + b * 0.114;

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create an error-diffusion dithering function from a 2D weight grid.
 *
 * - `normalize`: normalize kernel weights to sum to 1 so total error is
 *   conserved.  Default true.  Set false for kernels that intentionally
 *   discard part of the error.
 */
export const createDiffuser = (
  denom: number,
  grid: number[][],
  opts?: { normalize?: boolean },
): DitherFn => {
  const normalize = opts?.normalize ?? true;

  if (!grid.length || !grid[0].length) {
    throw new Error("createDiffuser: grid must have at least one row and one column");
  }

  if (denom <= 0) {
    throw new Error("createDiffuser: denom must be > 0");
  }

  // ── build diffusion entries ──────────────────────────────────

  const rows = grid.length;
  const cols = grid[0].length;
  const originCol = Math.floor(cols / 2);

  const entries: Array<[number, number, number]> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 && c === originCol) continue;
      const w = grid[r][c];
      if (w === 0) continue;
      entries.push([c - originCol, r, w / denom]);
    }
  }

  // ── normalize (skip for kernels that intentionally discard error) ──

  const sum = entries.reduce((acc, [, , wf]) => acc + wf, 0);

  const kernel: Array<[number, number, number]> =
    normalize && sum !== 0
      ? entries.map(([dx, dy, wf]) => [dx, dy, wf / sum])
      : entries;

  const reversedKernel = kernel.map(([dx, dy, wf]) => [-dx, dy, wf] as [number, number, number]);

  // ── return dither function ────────────────────────────────────

  return (image, options = {}) => {
    const { threshold = 128, strength = 1, serpentine = true } = options;

    const { data: src, width, height } = image;

    const buffer = new Float32Array(width * height);

    // RGB -> gray
    for (let p = 0, i = 0; i < src.length; p++, i += 4) {
      buffer[p] = rgbToGray(src[i], src[i + 1], src[i + 2]);
    }

    const diffusionStrength = Math.max(0, strength);

    for (let y = 0; y < height; y++) {
      const reverse = serpentine && (y & 1);

      const start = reverse ? width - 1 : 0;
      const end = reverse ? -1 : width;
      const step = reverse ? -1 : 1;

      const active = reverse ? reversedKernel : kernel;

      for (let x = start; x !== end; x += step) {
        const index = y * width + x;

        const old = buffer[index];

        // quantisation
        const value = old < threshold ? 0 : 255;

        // error
        const error = old - value;

        const offset = index * 4;

        src[offset] = value;
        src[offset + 1] = value;
        src[offset + 2] = value;

        // diffuse
        if (diffusionStrength > 0 && error !== 0) {
          for (const [dx, dy, wf] of active) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              buffer[ny * width + nx] += error * (wf * diffusionStrength);
            }
          }
        }
      }
    }

    return image;
  };
};