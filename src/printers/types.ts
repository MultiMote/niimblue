import type {
  EncodedImage,
  FirmwareProgressEvent,
  LabelType,
  PageColorType,
  PrintDirection,
  PrintOptions,
  PrintProgressEvent,
  PrintTaskName,
} from "@mmote/niimbluelib";
import type { ConnectionType } from "$/types";

export type PrinterFamily = string;

export type PrinterCapabilities = {
  deviceIdConnection: boolean;
  firmwareUpdate: boolean;
  printerReset: boolean;
  rfid: boolean;
  soundSettings: boolean;
  printTaskSelection: boolean;
  paperTypeSelection: boolean;
};

export type PrinterMetadata = {
  model: string;
  id?: readonly number[];
  dpi: number;
  printDirection: PrintDirection;
  printheadPixels: number;
  paperTypes: number[];
  densityMin: number;
  densityMax: number;
  densityDefault: number;
};

export type PrinterInfo = Record<string, unknown>;

export type PrinterHeartbeatData = {
  chargeLevel?: number;
  paperRfidSuccess?: boolean;
  ribbonRfidSuccess?: boolean;
  [key: string]: unknown;
};

export type PrinterRfidInfo = object;

export type PrinterPacket = {
  command: number;
  toBytes(): Uint8Array;
};

export type PrinterEventMap = {
  connect: { info: { deviceName?: string } };
  disconnect: unknown;
  printerinfofetched: { info: PrinterInfo };
  heartbeat: { data: PrinterHeartbeatData };
  heartbeatfailed: { failedAttempts: number };
  printprogress: PrintProgressEvent;
  firmwareprogress: FirmwareProgressEvent;
  packetsent: { packet: PrinterPacket };
  packetreceived: { packet: PrinterPacket };
};

export type PrinterEventName = keyof PrinterEventMap;
export type PrinterEventListener<K extends PrinterEventName> = (event: PrinterEventMap[K]) => void;

export interface PrinterPrintTask {
  printInit(): Promise<void>;
  printPage(image: EncodedImage, quantity?: number): Promise<void>;
  waitForFinished(): Promise<void>;
  printEnd(): Promise<unknown>;
}

export interface PrinterClient {
  readonly family: PrinterFamily;
  readonly connectionType: ConnectionType;
  readonly capabilities: PrinterCapabilities;

  connect(options?: { deviceId?: string }): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  fetchPrinterInfo(): Promise<void>;
  getModelMetadata(): PrinterMetadata | undefined;
  getPrintTaskType(): PrintTaskName | undefined;

  encodeCanvas(canvas: HTMLCanvasElement, pageColor: PageColorType, printDirection: PrintDirection): EncodedImage;
  newPrintTask(name: PrintTaskName, options: Partial<PrintOptions>): PrinterPrintTask;
  printEnd(): Promise<unknown>;

  getRfidInfo(): Promise<PrinterRfidInfo>;
  getRibbonRfidInfo(): Promise<PrinterRfidInfo>;
  setSoundEnabled(enabled: boolean): Promise<void>;
  reset(): Promise<void>;
  firmwareUpgrade(data: Uint8Array, version: string): Promise<void>;

  setPacketInterval(milliseconds: number): void;
  startHeartbeat(): void;
  stopHeartbeat(): void;

  getPacketCommandName(direction: "request" | "response", command: number): string | undefined;

  on<K extends PrinterEventName>(event: K, listener: PrinterEventListener<K>): this;
  off<K extends PrinterEventName>(event: K, listener: PrinterEventListener<K>): this;
}

export type { EncodedImage, LabelType, PageColorType, PrintDirection, PrintOptions, PrintTaskName };
