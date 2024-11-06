import { LabelType, printTaskNames } from "@mmote/niimbluelib";
import { fabric } from "fabric";
import { z } from "zod";

export type ConnectionState = "connecting" | "connected" | "disconnected";
export type ConnectionType = "bluetooth" | "serial";
export type LabelUnit = "mm" | "px";
export type OjectType = "text" | "rectangle" | "line" | "circle" | "image" | "qrcode" | "barcode";
export type PostProcessType = "threshold" | "dither";
export type MoveDirection = "up" | "down" | "left" | "right";

/** Not validated */
export const FabricObjectSchema = z.custom<fabric.Object>((val: any): boolean => {
  return typeof val === "object";
});

export const LabelPropsSchema = z.object({
  printDirection: z.enum(["left", "top"]),
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
});

export const LabelPresetSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(["mm", "px"]),
  dpmm: z.number().positive(),
  printDirection: z.enum(["left", "top"]),
  title: z.string().optional(),
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
  timestamp: z.number().positive().optional()
});

const [firstTask, ...otherTasks] = printTaskNames;

export const PreviewPropsOffsetSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  offsetType: z.enum(["inner", "outer"]).default("inner"),
});

export const PreviewPropsSchema = z.object({
  postProcess: z.enum(["threshold", "dither"]).optional(),
  threshold: z.number().gte(1).lte(255).optional(),
  quantity: z.number().gte(1).optional(),
  density: z.number().gte(1).optional(),
  labelType: z.nativeEnum(LabelType).optional(),
  printTaskName: z.enum([firstTask, ...otherTasks]).optional(),
  offset: PreviewPropsOffsetSchema.optional(),
});

export type LabelProps = z.infer<typeof LabelPropsSchema>;
export type LabelPreset = z.infer<typeof LabelPresetSchema>;
export type FabricJson = z.infer<typeof FabricJsonSchema>;
export type ExportedLabelTemplate = z.infer<typeof ExportedLabelTemplateSchema>;
export type PreviewPropsOffset = z.infer<typeof PreviewPropsOffsetSchema>;
export type PreviewProps = z.infer<typeof PreviewPropsSchema>;
