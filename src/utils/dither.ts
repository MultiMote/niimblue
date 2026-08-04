/**
 * Error diffusion dithering engine.
 *
 * Behaviour is aligned with ditheringstudio.com (https://ditheringstudio.com):
 * - configurable threshold (`gray < threshold` → black)
 * - configurable diffusion strength (1 = standard kernel weights)
 * - serpentine scanning (kernel mirrored on reverse rows)
 * - `clamp` mode accumulates error in an 8-bit clamped buffer — every
 *   diffusion write is rounded to an integer and clipped to [0, 255],
 *   exactly like the site's Uint8ClampedArray implementation.  This
 *   discards out-of-range error (bright halos vanish) and matches the
 *   site's output for all kernels except Floyd–Steinberg, which the site
 *   implements with an unclamped Float32Array buffer.
 * - normalized kernel (error conservation); disable for kernels that
 *   intentionally discard error (e.g. Atkinson).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DitherOptions = {
  /** Binary threshold. 0→white, 128→standard, 255→black */
  threshold?: number;
  /** Diffusion strength. 0→none, 1→standard, >1→stronger */
  strength?: number;
  /** Serpentine (bidirectional) scanning */
  serpentine?: boolean;
};

export type DitherFn = (image: ImageData, options?: DitherOptions) => ImageData;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const rgbToGray = (r: number, g: number, b: number): number => r * 0.299 + g * 0.587 + b * 0.114;

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create an error-diffusion dithering function from a 2D weight grid.
 *
 * The grid is laid out as a visual stencil — the current pixel sits at the
 * centre column of the first row.  Each number is a numerator; the weight
 * contributed to a neighbour is `value / denom`.  Zero entries are skipped.
 *
 * Example (Floyd–Steinberg):
 *
 *   createDiffuser(16, [
 *     [0, 0, 7],
 *     [3, 5, 1],
 *   ]);
 *
 * Options mirror the ditheringstudio.com engine:
 * - `clamp`: accumulate error in an 8-bit clamped buffer (site behaviour for
 *   every algorithm except Floyd–Steinberg).  Default false.  In clamp mode
 *   weights are always the raw `w/denom` ratios — the site never normalizes —
 *   so `normalize` only applies to the float (Floyd–Steinberg) mode.
 * - `defaultSerpentine`: serpentine when `options.serpentine` is not given
 *   (the site's per-algorithm default).  Default true.
 */
export const createDiffuser = (
  denom: number,
  grid: number[][],
  opts?: { normalize?: boolean; clamp?: boolean; defaultSerpentine?: boolean },
): DitherFn => {
  const normalize = opts?.normalize ?? true;
  const clamp = opts?.clamp ?? false;
  const defaultSerpentine = opts?.defaultSerpentine ?? true;

  if (!grid.length || !grid[0].length) {
    throw new Error("createDiffuser: grid must have at least one row and one column");
  }

  if (denom <= 0) {
    throw new Error("createDiffuser: denom must be > 0");
  }

  // ── build diffusion entries ──────────────────────────────────
  // Keep both the integer weight (w, for the site's exact float order
  // ((err * strength) * w) / denom) and the pre-divided weight
  // (w/denom, for the site's Floyd–Steinberg order err * (weight * strength)).

  const rows = grid.length;
  const cols = grid[0].length;
  const originCol = Math.floor(cols / 2);

  const entries: Array<[number, number, number, number]> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 && c === originCol) continue;
      const w = grid[r][c];
      if (w === 0) continue;
      entries.push([c - originCol, r, w, w / denom]);
    }
  }

  // ── normalize (skip for kernels that intentionally discard error) ──

  const sum = entries.reduce((acc, [, , w]) => acc + w / denom, 0);

  const kernel: Array<[number, number, number, number]> =
    normalize && sum !== 0
      ? entries.map(([dx, dy, w, wf]) => [dx, dy, w, wf / sum])
      : entries;

  // ── return dither function ────────────────────────────────────

  return (image, options = {}) => {
    const { threshold = 128, strength = 1, serpentine = defaultSerpentine } = options;

    const { data: src, width, height } = image;

    // clamp mode: 8-bit buffer, so every diffusion write is rounded and
    // clipped to [0, 255] exactly like the site's Uint8ClampedArray.
    // Otherwise an unclamped float buffer (site's Floyd–Steinberg).
    const buffer: Uint8ClampedArray | Float32Array = clamp
      ? new Uint8ClampedArray(width * height)
      : new Float32Array(width * height);

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

      const active = reverse
        ? kernel.map(([dx, dy, w, wf]) => [-dx, dy, w, wf] as [number, number, number, number])
        : kernel;

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
          for (const [dx, dy, w, wf] of active) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              // Multiplication order matters for bit-identical output:
              // the site's generic engine computes ((err * strength) * w) / denom
              // while its hand-written Floyd–Steinberg computes err * (weight * strength).
              const amount = clamp
                ? (error * diffusionStrength * w) / denom
                : error * (wf * diffusionStrength);
              buffer[ny * width + nx] += amount;
            }
          }
        }
      }
    }

    return image;
  };
};