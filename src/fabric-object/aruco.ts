import * as fabric from "fabric";
import { OBJECT_DEFAULTS_TEXT, OBJECT_SIZE_DEFAULTS } from "$/defaults";

export type ArUcoDictionary = "4x4" | "5x5" | "6x6";

interface DictInfo {
  size: number;
  bytesPerMarker: number;
  count: number;
  data: number[][];
}

// first 50 markers from OpenCV's predefined dictionaries (via arucogen)
const DICTIONARIES: Record<ArUcoDictionary, DictInfo> = {
  "4x4": {
    size: 4,
    bytesPerMarker: 2,
    count: 50,
    data: [
      [181, 50], [15, 154], [51, 45], [153, 70], [84, 158], [121, 205],
      [158, 46], [196, 242], [254, 218], [207, 86], [249, 145], [17, 167],
      [14, 183], [42, 15], [36, 177], [38, 62], [70, 101], [102, 0],
      [108, 94], [118, 175], [134, 139], [176, 43], [204, 213], [221, 130],
      [254, 71], [148, 113], [172, 228], [165, 84], [33, 35], [52, 111],
      [68, 21], [87, 178], [158, 207], [240, 203], [8, 174], [9, 41],
      [24, 117], [4, 255], [13, 246], [28, 90], [23, 24], [42, 40],
      [50, 140], [56, 178], [36, 232], [46, 235], [45, 63], [75, 100],
      [80, 46], [80, 19],
    ],
  },
  "5x5": {
    size: 5,
    bytesPerMarker: 4,
    count: 50,
    data: [
      [162, 217, 94, 0], [14, 3, 115, 0], [215, 135, 110, 1],
      [129, 202, 251, 1], [215, 90, 146, 0], [234, 4, 22, 1],
      [105, 235, 246, 0], [113, 10, 53, 1], [134, 176, 153, 0],
      [152, 159, 210, 1], [158, 119, 1, 1], [209, 109, 96, 0],
      [243, 21, 136, 1], [47, 56, 179, 0], [254, 126, 84, 0],
      [40, 241, 191, 1], [75, 211, 172, 0], [95, 81, 55, 1],
      [123, 38, 226, 0], [131, 14, 244, 0], [150, 237, 58, 1],
      [168, 114, 32, 0], [181, 134, 80, 1], [93, 9, 111, 0],
      [206, 104, 17, 1], [210, 204, 185, 0], [225, 231, 69, 1],
      [17, 33, 35, 0], [29, 203, 57, 0], [18, 17, 29, 1],
      [19, 155, 183, 0], [27, 68, 57, 1], [32, 104, 103, 0],
      [37, 85, 100, 0], [35, 33, 221, 0], [61, 55, 245, 0],
      [76, 197, 86, 0], [65, 104, 128, 1], [77, 86, 142, 1],
      [67, 30, 57, 0], [86, 148, 18, 1], [82, 151, 207, 0],
      [108, 36, 251, 1], [97, 132, 236, 1], [109, 63, 24, 1],
      [116, 177, 61, 0], [116, 220, 203, 1], [124, 164, 3, 0],
      [122, 200, 146, 1], [123, 91, 235, 1],
    ],
  },
  "6x6": {
    size: 6,
    bytesPerMarker: 5,
    count: 50,
    data: [
      [30, 61, 216, 42, 6], [14, 251, 163, 137, 1], [21, 144, 126, 172, 13],
      [201, 27, 48, 105, 14], [214, 7, 214, 225, 5], [216, 232, 224, 230, 8],
      [66, 104, 180, 31, 5], [136, 165, 15, 41, 10], [48, 125, 82, 79, 13],
      [60, 47, 52, 179, 12], [69, 223, 199, 78, 3], [72, 216, 91, 37, 7],
      [113, 5, 88, 252, 6], [134, 220, 250, 208, 7], [141, 114, 169, 63, 6],
      [162, 184, 157, 205, 14], [9, 253, 30, 156, 4], [21, 77, 189, 24, 15],
      [48, 10, 49, 14, 2], [72, 7, 239, 175, 13], [86, 223, 17, 219, 6],
      [102, 136, 50, 116, 12], [118, 232, 203, 120, 1], [154, 83, 217, 207, 3],
      [169, 203, 132, 2, 4], [198, 117, 73, 73, 0], [193, 210, 136, 148, 1],
      [231, 72, 8, 82, 11], [234, 47, 202, 132, 8], [233, 99, 183, 123, 1],
      [250, 54, 101, 42, 15], [6, 91, 255, 123, 13], [5, 65, 215, 45, 6],
      [12, 247, 36, 106, 2], [19, 56, 163, 158, 11], [21, 168, 147, 231, 4],
      [58, 65, 126, 233, 14], [79, 17, 226, 108, 0], [83, 13, 182, 210, 0],
      [88, 155, 250, 227, 4], [100, 9, 232, 160, 11], [96, 83, 122, 137, 1],
      [97, 89, 6, 155, 10], [107, 255, 120, 215, 11], [112, 173, 150, 164, 15],
      [117, 132, 111, 113, 10], [122, 149, 25, 47, 12], [134, 9, 118, 10, 10],
      [138, 45, 68, 195, 15], [147, 235, 120, 177, 4],
    ],
  },
};

function decodeBits(dict: ArUcoDictionary, markerId: number): number[][] {
  const info = DICTIONARIES[dict];
  if (markerId < 0 || markerId >= info.count) return [];

  const bytes = info.data[markerId];
  const bits: number[] = [];
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }

  const grid: number[][] = [];
  for (let r = 0; r < info.size; r++) {
    grid.push(bits.slice(r * info.size, (r + 1) * info.size));
  }
  return grid;
}

export const arUcoDefaultValues: Partial<fabric.TClassProperties<ArUcoMarker>> = {
  dictionary: "4x4",
  markerId: 5,
  stroke: "#000000",
  fill: "#ffffff",
  ...OBJECT_SIZE_DEFAULTS,
};

interface UniqueArUcoProps {
  dictionary: ArUcoDictionary;
  markerId: number;
}

export interface ArUcoMarkerProps extends fabric.FabricObjectProps, UniqueArUcoProps {}
export interface SerializedArUcoMarkerProps extends fabric.SerializedObjectProps, UniqueArUcoProps {}

const ARUCO_PROPS = ["dictionary", "markerId"] as const;

export class ArUcoMarker<
    Props extends fabric.TOptions<ArUcoMarkerProps> = Partial<ArUcoMarkerProps>,
    SProps extends SerializedArUcoMarkerProps = SerializedArUcoMarkerProps,
    EventSpec extends fabric.ObjectEvents = fabric.ObjectEvents,
  >
  extends fabric.FabricObject<Props, SProps, EventSpec>
  implements ArUcoMarkerProps
{
  static override readonly type = "ArUcoMarker";

  declare dictionary: ArUcoDictionary;
  declare markerId: number;

  constructor(options?: Props) {
    super();
    Object.assign(this, arUcoDefaultValues);
    this.setOptions(options);
    this.lockScalingFlip = true;
    this.setControlsVisibility({
      ml: false,
      mt: false,
      mr: false,
      mb: false,
      tl: false,
      tr: false,
      bl: false,
    });
  }

  override _set(key: string, value: any): this {
    super._set(key, value);
    if (key === "dictionary" || key === "markerId") {
      this.dirty = true;
    }
    return this;
  }

  renderError(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.translate(-0.5, -0.5);
    ctx.fillRect(0, 0, this.width + 1, this.height + 1);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = `16px ${OBJECT_DEFAULTS_TEXT.fontFamily}`;
    ctx.fillText("ERR", 0, 0);
    ctx.restore();
  }

  override _render(ctx: CanvasRenderingContext2D): void {
    const grid = decodeBits(this.dictionary, this.markerId);
    if (grid.length === 0) {
      this.renderError(ctx);
      super._render(ctx);
      return;
    }

    const innerSize = DICTIONARIES[this.dictionary].size;
    const totalCells = innerSize + 2; // +2 for border
    const cellSize = Math.floor(this.width / totalCells);
    const markerWidth = cellSize * totalCells;

    if (cellSize < 1 || markerWidth > this.width) {
      this.renderError(ctx);
      super._render(ctx);
      return;
    }

    ctx.save();
    ctx.translate(-markerWidth / 2, -markerWidth / 2);
    ctx.translate(-0.5, -0.5);

    // black background (border + black cells)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, markerWidth, markerWidth);

    // white cells
    ctx.fillStyle = "white";
    for (let r = 0; r < innerSize; r++) {
      for (let c = 0; c < innerSize; c++) {
        if (grid[r][c] === 1) {
          ctx.fillRect((c + 1) * cellSize, (r + 1) * cellSize, cellSize, cellSize);
        }
      }
    }

    ctx.restore();
    super._render(ctx);
  }

  override toObject(propertiesToInclude: any[] = []) {
    return super.toObject([...ARUCO_PROPS, ...propertiesToInclude]);
  }
}

fabric.classRegistry.setClass(ArUcoMarker, "ArUcoMarker");

export default ArUcoMarker;
