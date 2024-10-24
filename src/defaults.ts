import type { LabelPreset, LabelProps } from "./types";

/** Default presets for LabelPropsEditor */
export const DEFAULT_LABEL_PRESETS: LabelPreset[] = [
  { width: 30, height: 12, unit: "mm", dpmm: 8, printDirection: "left" },
  { width: 50, height: 30, unit: "mm", dpmm: 8, printDirection: "top" },
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
  textAlign: "center",
  originX: "center",
  originY: "center",
  lineHeight: 1,
};
