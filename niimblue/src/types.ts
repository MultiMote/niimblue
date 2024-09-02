import type { PrintDirection } from "@mmote/niimbluelib";

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
