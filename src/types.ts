import type { PrintDirection } from "@mmote/niimbluelib";
import { fabric } from "fabric";

export type ConnectionState = "connecting" | "connected" | "disconnected";
export type ConnectionType = "bluetooth" | "serial";

export interface LabelProps {
  printDirection: PrintDirection;
  size: { width: number; height: number };
}
export type LabelPreset = {
  width: number;
  height: number;
  unit: string;
  dpmm: number;
  printDirection: PrintDirection;
};

export type OjectType = "text" | "rectangle" | "line" | "circle" | "image" | "qrcode" | "barcode";

export interface FabricJson {
  version: string;
  objects: fabric.Object[];
}

export interface ExportedLabelTemplate {
  canvas: FabricJson;
  label: LabelProps;
}

export type PostProcessType = "threshold" | "dither";

export type MoveDirection = "Up" | "Down" | "Left" | "Right";
