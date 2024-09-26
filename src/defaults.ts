import type { LabelPreset } from "./types";

export const DEFAULT_LABEL_PRESETS: LabelPreset[] = [
  { width: 30, height: 12, unit: "mm", dpmm: 8, printDirection: "left" },
  { width: 50, height: 30, unit: "mm", dpmm: 8, printDirection: "top" },
];
