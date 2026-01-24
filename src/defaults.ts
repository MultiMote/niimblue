import * as fabric from "fabric";
import type { AppConfig, LabelPreset, LabelProps } from "$/types";

/** Default presets for LabelPropsEditor */
export const DEFAULT_LABEL_PRESETS: LabelPreset[] = [
  // 203dpi
  { width: 40, height: 12, unit: "mm", dpmm: 8, printDirection: "left", shape: "rect" },
  { width: 50, height: 30, unit: "mm", dpmm: 8, printDirection: "top", shape: "rect" },
  // 300dpi
  { width: 40, height: 12, unit: "mm", dpmm: 11.81, printDirection: "left", shape: "rect", title: "40x12mm 300dpi" },
  { width: 50, height: 30, unit: "mm", dpmm: 11.81, printDirection: "top", shape: "rect", title: "50x30mm 300dpi" },
];

/** Default canvas dimensions */
export const DEFAULT_LABEL_PROPS: LabelProps = {
  printDirection: "left",
  size: {
    width: 240,
    height: 96,
  },
};

/** Object movement snapping */
export const GRID_SIZE: number = 5;

/** Newly created Fabric object dimensions */
export const OBJECT_SIZE_DEFAULTS = {
  width: 64,
  height: 64,
};

/** Newly created Fabric object common properties */
export const OBJECT_DEFAULTS = {
  snapAngle: 10,
  top: 10,
  left: 10,
};

/** Newly created Fabric vector object properties */
export const OBJECT_DEFAULTS_VECTOR = {
  ...OBJECT_DEFAULTS,
  fill: "transparent",
  stroke: "black",
  strokeWidth: 3,
  strokeUniform: true,
};

/** Newly created Fabric text object properties */
export const OBJECT_DEFAULTS_TEXT = {
  ...OBJECT_DEFAULTS,
  fill: "black",
  fontFamily: "Noto Sans Variable",
  textAlign: "center" as CanvasTextAlign,
  originX: "center" as fabric.TOriginX,
  originY: "center" as fabric.TOriginY,
  lineHeight: 1,
};

/** Scale image to this height when making a label thumbnail */
export const THUMBNAIL_HEIGHT = 48;

/** Generate thumbnail in jpeg format with this quality */
export const THUMBNAIL_QUALITY = 0.7;

export const APP_CONFIG_DEFAULTS: AppConfig = {
  fitMode: "stretch",
  pageDelay: 0,
};

export const CSV_DEFAULT = "var1,var2\n123,456\n777,888";
