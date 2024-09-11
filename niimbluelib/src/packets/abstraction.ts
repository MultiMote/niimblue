import {
  AutoShutdownTime,
  BatteryChargeLevel,
  ConnectResult,
  HeartbeatType,
  LabelType,
  NiimbotPacket,
  PacketGenerator,
  PrinterInfoType,
  PrintOptions,
  ResponseCommandId,
  SoundSettingsItemType,
  SoundSettingsType,
  EncodedImage,
  NiimbotAbstractClient,
  Utils,
  Validators,
  ProtocolVersion,
  PrintProgressEvent,
} from "..";
import { SequentialDataReader } from "./data_reader";

export class PrintError extends Error {
  public readonly reasonId: number;

  constructor(message: string, reasonId: number) {
    super(message);
    this.reasonId = reasonId;
  }
}

export interface PrintStatus {
  /** 0 – n */
  page: number;
  /** 0 – 100 */
  pagePrintProgress: number;
  /** 0 – 100 */
  pageFeedProgress: number;
}

export interface RfidInfo {
  tagPresent: boolean;
  uuid: string;
  barCode: string;
  serialNumber: string;
  allPaper: number;
  usedPaper: number;
  consumablesType: LabelType;
}

/** closingState inverted on some printers */
export interface HeartbeatData {
  paperState: number;
  rfidReadState: number;
  lidClosed: boolean;
  powerLevel: BatteryChargeLevel;
}

export interface SoundSettings {
  category: SoundSettingsType;
  item: SoundSettingsItemType;
  value: boolean;
}

export interface PrinterStatusData {
  supportColor: number;
  protocolVersion: number;
}

/** Not sure for name. */
export class Abstraction {
  private readonly DEFAULT_TIMEOUT: number = 1_000;
  private client: NiimbotAbstractClient;
  private timeout: number = this.DEFAULT_TIMEOUT;
  private statusPollTimer: NodeJS.Timeout | undefined;

  constructor(client: NiimbotAbstractClient) {
    this.client = client;
  }

  public getTimeout(): number {
    return this.timeout;
  }

  public setTimeout(value: number) {
    this.timeout = value;
  }

  public setDefaultTimeout() {
    this.timeout = this.DEFAULT_TIMEOUT;
  }

  /** Send packet and wait for response */
  private async send(packet: NiimbotPacket): Promise<NiimbotPacket> {
    return this.client.sendPacketWaitResponse(packet, this.timeout);
  }

  public async getPrintStatus(): Promise<PrintStatus> {
    const packet = await this.send(PacketGenerator.printStatus());

    if (packet.command === ResponseCommandId.In_PrintError) {
      Validators.u8ArrayLengthEquals(packet.data, 1);
      throw new PrintError(`Print error (${ResponseCommandId[packet.command]} packet received)`, packet.data[0]);
    }

    Validators.u8ArrayLengthAtLeast(packet.data, 4); // can be 8, 10, but ignore it for now

    const r = new SequentialDataReader(packet.data);
    const page = r.readI16();
    const pagePrintProgress = r.readI8();
    const pageFeedProgress = r.readI8();

    if (packet.dataLength === 10) {
      r.skip(2);
      const error = r.readI8();

      if (error !== 0) {
        throw new PrintError(`Print error (${ResponseCommandId[packet.command]} packet flag)`, error);
      }
    }

    return { page, pagePrintProgress, pageFeedProgress };
  }

  public async connectResult(): Promise<ConnectResult> {
    const packet = await this.send(PacketGenerator.connect());
    Validators.u8ArrayLengthAtLeast(packet.data, 1);
    return packet.data[0] as ConnectResult;
  }

  public async getPrinterStatusData(): Promise<PrinterStatusData> {
    let protocolVersion = 0;
    const packet = await this.send(PacketGenerator.getPrinterStatusData());
    let supportColor = 0;

    if (packet.dataLength > 12) {
      supportColor = packet.data[10];

      const n = packet.data[11] * 100 + packet.data[12];
      if (n >= 204 && n < 300) {
        protocolVersion = 3;
      }
      if (n >= 301) {
        protocolVersion = 4;
      }
    }

    return {
      supportColor,
      protocolVersion,
    };
  }

  public async getPrinterModel(): Promise<number> {
    const packet = await this.send(PacketGenerator.getPrinterInfo(PrinterInfoType.PrinterModelId));
    Validators.u8ArrayLengthEquals(packet.data, 2);
    return Utils.bytesToI16(packet.data);
  }

  /** Read paper nfc tag info */
  public async rfidInfo(): Promise<RfidInfo> {
    const packet = await this.send(PacketGenerator.rfidInfo());

    const info: RfidInfo = {
      tagPresent: false,
      uuid: "",
      barCode: "",
      serialNumber: "",
      allPaper: -1,
      usedPaper: -1,
      consumablesType: LabelType.Invalid,
    };

    if (packet.dataLength === 1) {
      return info;
    }

    const r = new SequentialDataReader(packet.data);
    info.tagPresent = true;
    info.uuid = Utils.bufToHex(r.readBytes(8), "");
    info.barCode = r.readVString();
    info.serialNumber = r.readVString();
    info.allPaper = r.readI16();
    info.usedPaper = r.readI16();
    info.consumablesType = r.readI8() as LabelType;
    r.end();

    return info;
  }

  public async heartbeat(): Promise<HeartbeatData> {
    const packet = await this.send(PacketGenerator.heartbeat(HeartbeatType.Advanced1));

    const info: HeartbeatData = {
      paperState: -1,
      rfidReadState: -1,
      lidClosed: false,
      powerLevel: BatteryChargeLevel.Charge0,
    };

    // originally expected packet length is bound to model id, but we make it more robust and simple
    const len = packet.dataLength;
    const r = new SequentialDataReader(packet.data);

    if (len === 10) {
      // d110
      r.skip(8);
      info.lidClosed = r.readBool();
      info.powerLevel = r.readI8();
    } else if (len === 20) {
      r.skip(18);
      info.paperState = r.readI8();
      info.rfidReadState = r.readI8();
    } else if (len === 19) {
      r.skip(15);
      info.lidClosed = r.readBool();
      info.powerLevel = r.readI8();
      info.paperState = r.readI8();
      info.rfidReadState = r.readI8();
    } else if (len === 13) {
      // b1
      r.skip(9);
      info.lidClosed = r.readBool();
      info.powerLevel = r.readI8();
      info.paperState = r.readI8();
      info.rfidReadState = r.readI8();
    } else {
      throw new Error("Invalid heartbeat length");
    }
    r.end();

    const model: number | undefined = this.client.getPrinterInfo().model_id;

    if (model !== undefined && ![512, 514, 513, 2304, 1792, 3584, 5120, 2560, 3840, 4352, 272].includes(model)) {
      info.lidClosed = !info.lidClosed;
    }

    return info;
  }

  public async getBatteryChargeLevel(): Promise<BatteryChargeLevel> {
    const packet = await this.send(PacketGenerator.getPrinterInfo(PrinterInfoType.BatteryChargeLevel));
    Validators.u8ArrayLengthEquals(packet.data, 1);
    return packet.data[0] as BatteryChargeLevel;
  }

  public async getAutoShutDownTime(): Promise<AutoShutdownTime> {
    const packet = await this.send(PacketGenerator.getPrinterInfo(PrinterInfoType.AutoShutdownTime));
    Validators.u8ArrayLengthEquals(packet.data, 1);
    return packet.data[0] as AutoShutdownTime;
  }

  public async setAutoShutDownTime(time: AutoShutdownTime): Promise<void> {
    await this.send(PacketGenerator.setAutoShutDownTime(time));
  }

  public async getLabelType(): Promise<LabelType> {
    const packet = await this.send(PacketGenerator.getPrinterInfo(PrinterInfoType.LabelType));
    Validators.u8ArrayLengthEquals(packet.data, 1);
    return packet.data[0] as LabelType;
  }

  public async getPrinterSerialNumber(): Promise<string> {
    const packet = await this.send(PacketGenerator.getPrinterInfo(PrinterInfoType.SerialNumber));
    Validators.u8ArrayLengthAtLeast(packet.data, 1);
    return Utils.u8ArrayToString(packet.data);
  }

  public async getPrinterBluetoothMacAddress(): Promise<string> {
    const packet = await this.send(PacketGenerator.getPrinterInfo(PrinterInfoType.BluetoothAddress));
    Validators.u8ArrayLengthAtLeast(packet.data, 1);
    return Utils.bufToHex(packet.data.reverse(), ":");
  }

  public async isSoundEnabled(soundType: SoundSettingsItemType): Promise<boolean> {
    const packet = await this.send(PacketGenerator.getSoundSettings(soundType));
    Validators.u8ArrayLengthEquals(packet.data, 3);
    const value = !!packet.data[2];
    return value;
  }

  public async setSoundEnabled(soundType: SoundSettingsItemType, value: boolean): Promise<void> {
    await this.send(PacketGenerator.setSoundSettings(soundType, value));
  }

  /** Clear settings */
  public async printerReset(): Promise<void> {
    await this.send(PacketGenerator.printerReset());
  }

  public async print(
    protoVersion: ProtocolVersion,
    image: EncodedImage,
    options?: PrintOptions,
    timeout?: number
  ): Promise<void> {
    this.setTimeout(timeout ?? 10_000);
    const packets: NiimbotPacket[] = PacketGenerator.generatePrintSequence(protoVersion, image, options);
    try {
      for (const element of packets) {
        await this.send(element);
      }
    } finally {
      this.setDefaultTimeout();
    }
  }

  /**
   * Poll printer every {@link pollIntervalMs} and resolve when printer pages equals {@link pagesToPrint}, pagePrintProgress=100, pageFeedProgress=100.
   *
   * printprogress event is firing during this process.
   *
   * @param pagesToPrint Total pages to print.
   * @param pollIntervalMs Poll interval in milliseconds.
   */
  public async waitUntilPrintFinished(pagesToPrint: number, pollIntervalMs: number = 300): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statusPollTimer = setInterval(() => {
        this.getPrintStatus()
          .then((status: PrintStatus) => {
            this.client.dispatchTypedEvent(
              "printprogress",
              new PrintProgressEvent(status.page, pagesToPrint, status.pagePrintProgress, status.pageFeedProgress)
            );

            if (status.page === pagesToPrint && status.pagePrintProgress === 100 && status.pageFeedProgress === 100) {
              clearInterval(this.statusPollTimer);
              resolve();
            }
          })
          .catch((e: unknown) => {
            reject(e as Error);
          });
      }, pollIntervalMs);
    });
  }

  public async printEnd(): Promise<void> {
    await this.send(PacketGenerator.printEnd());
  }
}
