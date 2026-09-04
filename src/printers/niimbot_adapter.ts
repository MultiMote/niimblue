import {
  ImageEncoder,
  NiimbotCapacitorBleClient,
  RequestCommandId,
  ResponseCommandId,
  SoundSettingsItemType,
  instantiateClient,
  type NiimbotAbstractClient,
  type PageColorType,
  type PrintDirection,
  type PrintOptions,
  type PrintTaskName,
} from "@mmote/niimbluelib";
import type { ConnectionType } from "$/types";
import type {
  PrinterClient,
  PrinterEventListener,
  PrinterEventName,
  PrinterMetadata,
  PrinterPrintTask,
  PrinterRfidInfo,
} from "$/printers/types";

export class NiimbotPrinterClient implements PrinterClient {
  public readonly family = "niimbot" as const;
  public readonly capabilities;
  private readonly client: NiimbotAbstractClient;

  public constructor(public readonly connectionType: ConnectionType) {
    this.client = instantiateClient(connectionType);
    this.capabilities = {
      deviceIdConnection: this.client instanceof NiimbotCapacitorBleClient,
      firmwareUpdate: true,
      printerReset: true,
      rfid: true,
      soundSettings: true,
      printTaskSelection: true,
      paperTypeSelection: true,
    };
  }

  public async connect(options?: { deviceId?: string }): Promise<void> {
    if (this.client instanceof NiimbotCapacitorBleClient && options?.deviceId !== undefined) {
      await this.client.connect({ deviceId: options.deviceId });
    } else {
      await this.client.connect();
    }
  }

  public async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  public isConnected(): boolean {
    return this.client.isConnected();
  }

  public async fetchPrinterInfo(): Promise<void> {
    await this.client.fetchPrinterInfo();
  }

  public getModelMetadata(): PrinterMetadata | undefined {
    return this.client.getModelMetadata();
  }

  public getPrintTaskType(): PrintTaskName | undefined {
    return this.client.getPrintTaskType();
  }

  public encodeCanvas(canvas: HTMLCanvasElement, pageColor: PageColorType, printDirection: PrintDirection) {
    return ImageEncoder.encodeCanvas(canvas, pageColor, printDirection);
  }

  public newPrintTask(name: PrintTaskName, options: Partial<PrintOptions>): PrinterPrintTask {
    return this.client.abstraction.newPrintTask(name, options);
  }

  public printEnd(): Promise<boolean> {
    return this.client.abstraction.printEnd();
  }

  public async getRfidInfo(): Promise<PrinterRfidInfo> {
    return this.client.abstraction.rfidInfo();
  }

  public async getRibbonRfidInfo(): Promise<PrinterRfidInfo> {
    return this.client.abstraction.rfidInfo2();
  }

  public async setSoundEnabled(enabled: boolean): Promise<void> {
    await this.client.abstraction.setSoundEnabled(SoundSettingsItemType.BluetoothConnectionSound, enabled);
    await this.client.abstraction.setSoundEnabled(SoundSettingsItemType.PowerSound, enabled);
  }

  public async reset(): Promise<void> {
    await this.client.abstraction.printerReset();
  }

  public async firmwareUpgrade(data: Uint8Array, version: string): Promise<void> {
    await this.client.abstraction.firmwareUpgrade(data, version);
  }

  public setPacketInterval(milliseconds: number): void {
    this.client.setPacketInterval(milliseconds);
  }

  public startHeartbeat(): void {
    this.client.startHeartbeat();
  }

  public stopHeartbeat(): void {
    this.client.stopHeartbeat();
  }

  public getPacketCommandName(direction: "request" | "response", command: number): string | undefined {
    return direction === "request" ? RequestCommandId[command] : ResponseCommandId[command];
  }

  public on<K extends PrinterEventName>(event: K, listener: PrinterEventListener<K>): this {
    this.client.on(event, listener as never);
    return this;
  }

  public off<K extends PrinterEventName>(event: K, listener: PrinterEventListener<K>): this {
    this.client.off(event, listener as never);
    return this;
  }
}
