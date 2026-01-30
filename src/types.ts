import { LabelType, printTaskNames } from "@mmote/niimbluelib";
import * as fabric from "fabric";
import { z } from "zod";

export type ConnectionState = "connecting" | "connected" | "disconnected";
export type ConnectionType = "bluetooth" | "serial" | "capacitor-ble";

export type LabelUnit = "mm" | "px";
export type OjectType = "text" | "rectangle" | "line" | "circle" | "image" | "qrcode" | "barcode";
export type PostProcessType = "threshold" | "dither" | "bayer";
export type MoveDirection = "up" | "down" | "left" | "right";
export type LabelShape = "rect" | "rounded_rect" | "circle";
export type LabelSplit = "none" | "vertical" | "horizontal";
export type TailPosition = "right" | "bottom" | "left" | "top";
export type MirrorType = "none" | "copy" | "flip";

type _Range<T extends number, R extends unknown[]> =
  R['length'] extends T ? R[number] : _Range<T, [R['length'], ...R]>;

export type Range<T extends number> = number extends T ? number : _Range<T, []>;

export const CsvParamsSchema = z.object({
  data: z.string(),
});

export const UserIconsListSchema = z.array(
  z.object({
    name: z.string(),
    data: z.string(),
  }),
);

/** Not validated */
export const FabricObjectSchema = z.custom<fabric.FabricObject>((val: any): boolean => {
  return typeof val === "object";
});

export const LabelPropsSchema = z.object({
  printDirection: z.enum(["left", "top"]),
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  shape: z.enum(["rect", "rounded_rect", "circle"]).default("rect").optional(),
  split: z.enum(["none", "vertical", "horizontal"]).default("none").optional(),
  splitParts: z.number().min(1).default(2).optional(),
  tailPos: z.enum(["right", "bottom", "left", "top"]).default("right").optional(),
  tailLength: z.number().default(0).optional(),
  mirror: z.enum(["none", "copy", "flip"]).default("none").optional(),
});

export const LabelPresetSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(["mm", "px"]),
  dpmm: z.number().positive(),
  printDirection: z.enum(["left", "top"]),
  title: z.string().optional(),
  shape: z.enum(["rect", "rounded_rect", "circle"]).default("rect").optional(),
  split: z.enum(["none", "vertical", "horizontal"]).default("none").optional(),
  splitParts: z.number().min(1).default(2).optional(),
  tailPos: z.enum(["right", "bottom", "left", "top"]).default("right").optional(),
  tailLength: z.number().default(0).optional(),
  mirror: z.enum(["none", "copy", "flip"]).default("none").optional(),
});

export const FabricJsonSchema = z.object({
  version: z.string(),
  objects: z.array(FabricObjectSchema),
});

export const ExportedLabelTemplateSchema = z.object({
  canvas: FabricJsonSchema,
  label: LabelPropsSchema,
  thumbnailBase64: z.string().optional(),
  title: z.string().optional(),
  timestamp: z.number().positive().optional(),
  id: z.string().optional(), // filled with localStorage key, not exported
  csv: CsvParamsSchema.optional(),
});

const [firstTask, ...otherTasks] = printTaskNames;

export const PreviewPropsOffsetSchema = z.object({
  x: z.number(),
  y: z.number(),
  offsetType: z.enum(["inner", "outer"]),
});

export const PreviewPropsSchema = z.object({
  postProcess: z.enum(["threshold", "dither", "bayer"]).optional(),
  postProcessInvert: z.boolean().optional(),
  threshold: z.number().gte(1).lte(255).optional(),
  quantity: z.number().gte(1).optional(),
  density: z.number().gte(1).optional(),
  labelType: z.enum(LabelType).optional(),
  printTaskName: z.enum([firstTask, ...otherTasks]).optional(),
  offset: PreviewPropsOffsetSchema.optional(),
});

export const AutomationPropsSchema = z.object({
  /** Request device connect on page load. Works only for Capacitor BLE connection. */
  autoConnect: z.boolean().optional(),
  /** Connect to MAC or device id. Works only for Capacitor BLE connection. */
  autoConnectDeviceId: z.string().optional(),
  /** immediately - just open print preview dialog */
  startPrint: z.enum(["after_connect", "immediately"]).optional(),
});

export const AppConfigSchema = z.object({
  /** Keep image aspect ration when using "fit" button */
  fitMode: z.enum(["stretch", "ratio_min", "ratio_max"]),
  pageDelay: z.number().gte(0),
  iconListMode: z.enum(["user", "pack", "both"]),
});

export type CsvParams = z.infer<typeof CsvParamsSchema>;
export type UserIconsList = z.infer<typeof UserIconsListSchema>;
export type LabelProps = z.infer<typeof LabelPropsSchema>;
export type LabelPreset = z.infer<typeof LabelPresetSchema>;
export type FabricJson = z.infer<typeof FabricJsonSchema>;
export type ExportedLabelTemplate = z.infer<typeof ExportedLabelTemplateSchema>;
export type PreviewPropsOffset = z.infer<typeof PreviewPropsOffsetSchema>;
export type PreviewProps = z.infer<typeof PreviewPropsSchema>;
export type AutomationProps = z.infer<typeof AutomationPropsSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
