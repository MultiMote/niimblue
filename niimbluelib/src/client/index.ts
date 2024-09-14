import {
  AutoShutdownTime,
  BatteryChargeLevel,
  ConnectResult,
  getPrintTaskVersion,
  LabelType,
  NiimbotPacket,
  PrintTaskVersion,
} from "../packets";
import { TypedEventTarget } from "typescript-event-target";
import { ClientEventMap, HeartbeatEvent, PacketSentEvent, PrinterInfoFetchedEvent } from "./events";
import { Abstraction } from "../packets/abstraction";
import { getPrinterMetaById, PrinterModelMeta } from "..";

export type ConnectionInfo = {
  deviceName?: string;
  result: ConnectResult;
};

export interface PrinterInfo {
  connectResult?: ConnectResult;
  protocolVersion?: number;
  model_id?: number;
  serial?: string;
  mac?: string;
  charge?: BatteryChargeLevel;
  autoShutdownTime?: AutoShutdownTime;
  labelType?: LabelType;
}

export abstract class NiimbotAbstractClient extends TypedEventTarget<ClientEventMap> {
  public readonly abstraction: Abstraction;
  protected info: PrinterInfo = {};
  private heartbeatTimer?: NodeJS.Timeout;
  /** https://github.com/MultiMote/niimblue/issues/5 */
  protected packetIntervalMs: number = 10;

  constructor() {
    super();
    this.abstraction = new Abstraction(this);
  }

  /** Connect to printer port */
  public abstract connect(): Promise<ConnectionInfo>;

  /** Disconnect from printer port */
  public abstract disconnect(): Promise<void>;

  public abstract isConnected(): boolean;

  /**
   * Send packet and wait for response.
   * If packet.responsePacketCommandId is defined, it will wait for packet with this command id.
   */
  public abstract sendPacketWaitResponse(packet: NiimbotPacket, timeoutMs?: number): Promise<NiimbotPacket>;

  /**
   * Send raw bytes to the printer port.
   *
   * @param data Bytes to send.
   * @param force Ignore mutex lock. You should avoid using it.
   */
  public abstract sendRaw(data: Uint8Array, force?: boolean): Promise<void>;

  public async sendPacket(packet: NiimbotPacket, force?: boolean) {
    await this.sendRaw(packet.toBytes(), force);
    this.dispatchTypedEvent("packetsent", new PacketSentEvent(packet));
  }

  /** Send "connect" packet and fetch the protocol version */
  protected async initialNegotiate(): Promise<void> {
    const cfg = this.info;
    cfg.connectResult = await this.abstraction.connectResult();
    cfg.protocolVersion = 0;

    if (cfg.connectResult === ConnectResult.ConnectedNew) {
      cfg.protocolVersion = 1;
    } else if (cfg.connectResult === ConnectResult.ConnectedV3) {
      const statusData = await this.abstraction.getPrinterStatusData();
      cfg.protocolVersion = statusData.protocolVersion;
    }
  }

  public async fetchPrinterInfo(): Promise<PrinterInfo> {
    // console.log(await this.abstraction.getPrinterStatusData());
    this.info.model_id = await this.abstraction.getPrinterModel();
    this.info.serial = await this.abstraction.getPrinterSerialNumber();
    this.info.mac = await this.abstraction.getPrinterBluetoothMacAddress();
    this.info.charge = await this.abstraction.getBatteryChargeLevel();
    this.info.autoShutdownTime = await this.abstraction.getAutoShutDownTime();
    this.info.labelType = await this.abstraction.getLabelType();
    this.dispatchTypedEvent("printerinfofetched", new PrinterInfoFetchedEvent(this.info));
    return this.info;
  }

  public getPrinterInfo(): PrinterInfo {
    return this.info;
  }

  /**
   * Starts the heartbeat timer, "heartbeat" is emitted after packet received.
   *
   * @param interval Heartbeat interval, default is 1000ms
   */
  public startHeartbeat(intervalMs: number = 1000): void {
    this.heartbeatTimer = setInterval(() => {
      this.abstraction.heartbeat().then((data) => {
        this.dispatchTypedEvent("heartbeat", new HeartbeatEvent(data));
      }).catch(console.error);
    }, intervalMs);
  }

  public stopHeartbeat(): void {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }

  public isHeartbeatStarted(): boolean {
    return this.heartbeatTimer === undefined;
  }

  /** Get printer capabilities based on the printer model. Model library is hardcoded. */
  public getModelMetadata(): PrinterModelMeta | undefined {
    if (this.info.model_id === undefined) {
      return undefined;
    }
    return getPrinterMetaById(this.info.model_id);
  }

  /** Determine print task version if any */
  public getPrintTaskVersion(): PrintTaskVersion | undefined {
    const meta = this.getModelMetadata();

    if (meta === undefined) {
      return undefined;
    }

    return getPrintTaskVersion(meta.model);
  }

  public setPacketInterval(milliseconds: number) {
    this.packetIntervalMs = milliseconds;
  }
}

export * from "./events";
export * from "./bluetooth_impl";
export * from "./serial_impl";
