import { Mutex } from "async-mutex";
import { SerialPort } from "serialport";
import {
  ConnectionInfo,
  NiimbotAbstractClient,
  ConnectResult,
  NiimbotPacket,
  ResponseCommandId,
  Utils,
  ConnectEvent,
  DisconnectEvent,
  PacketReceivedEvent,
  RawPacketReceivedEvent,
  RawPacketSentEvent,
} from "@mmote/niimbluelib";

/** WIP. Uses serial communication (serialport lib) */
export class NiimbotHeadlessSerialClient extends NiimbotAbstractClient {
  private port?: SerialPort = undefined;
  private mutex: Mutex = new Mutex();
  private path: string;
  private isOpen: boolean = false;
  /** Buffer for fragmented data accumulation */
  private packetBuf: Uint8Array = new Uint8Array();

  constructor(path: string) {
    super();
    this.path = path;
  }

  public async connect(): Promise<ConnectionInfo> {
    await this.disconnect();

    const _port: SerialPort = new SerialPort({ path: this.path, baudRate: 115200, endOnClose: true });
    this.isOpen = true;

    _port.on("close", () => {
      this.isOpen = false;
      this.dispatchTypedEvent("disconnect", new DisconnectEvent());
    });

    _port.on("readable", () => {
      this.dataReady();
    });

    this.port = _port;

    try {
      await this.initialNegotiate();
      await this.fetchPrinterInfo();
    } catch (e) {
      console.error("Unable to fetch printer info (is it turned on?).");
      console.error(e);
    }

    const result: ConnectionInfo = {
      deviceName: `Serial (${this.path})`,
      result: this.info.connectResult ?? ConnectResult.FirmwareErrors,
    };

    this.dispatchTypedEvent("connect", new ConnectEvent(result));
    return result;
  }

  private dataReady() {

    while (true) {
      const result: Buffer | null = this.port!.read();
      if (result !== null) {
        const chunk = Uint8Array.from(result);
        // console.info(`<< serial chunk ${Utils.bufToHex(chunk)}`);

        const newBuf = new Uint8Array(this.packetBuf.length + chunk.length);
        newBuf.set(this.packetBuf, 0);
        newBuf.set(chunk, this.packetBuf.length);
        this.packetBuf = newBuf;
      } else {
        // console.log("done");
        break;
      }

      try {
        const packets: NiimbotPacket[] = NiimbotPacket.fromBytesMultiPacket(this.packetBuf);

        if (packets.length > 0) {
          this.dispatchTypedEvent("rawpacketreceived", new RawPacketReceivedEvent(this.packetBuf));

          packets.forEach((p) => {
            this.dispatchTypedEvent("packetreceived", new PacketReceivedEvent(p));
          });

          this.packetBuf = new Uint8Array();
        }
      } catch (e) {
        console.info(`Incomplete packet, ignoring:${Utils.bufToHex(this.packetBuf)}`);
      }
    }
  }

  public async disconnect() {
    this.stopHeartbeat();
    this.port?.close();
  }

  public isConnected(): boolean {
    return this.isOpen;
  }

  public async sendPacketWaitResponse(packet: NiimbotPacket, timeoutMs: number = 1000): Promise<NiimbotPacket> {
    if (!this.isConnected()) {
      throw new Error("Not connected");
    }

    return this.mutex.runExclusive(async () => {
      await this.sendPacket(packet, true);

      if (packet.oneWay) {
        return new NiimbotPacket(ResponseCommandId.Invalid, []); // or undefined is better?
      }

      return new Promise((resolve, reject) => {
        let timeout: NodeJS.Timeout | undefined = undefined;

        const listener = (evt: PacketReceivedEvent) => {
          if (
            packet.validResponseIds.length === 0 ||
            packet.validResponseIds.includes(evt.packet.command as ResponseCommandId)
          ) {
            clearTimeout(timeout);
            this.removeEventListener("packetreceived", listener);
            resolve(evt.packet);
          }
        };

        timeout = setTimeout(() => {
          this.removeEventListener("packetreceived", listener);
          reject(new Error(`Timeout waiting response (waited for ${Utils.bufToHex(packet.validResponseIds, ", ")})`));
        }, timeoutMs ?? 1000);

        this.addEventListener("packetreceived", listener);
      });
    });
  }

  public async sendRaw(data: Uint8Array, force?: boolean) {
    const send = async () => {
      if (!this.isConnected()) {
        throw new Error("Not connected");
      }
      await Utils.sleep(this.packetIntervalMs);
      this.port!.write(Buffer.from(data));
      this.dispatchTypedEvent("rawpacketsent", new RawPacketSentEvent(data));
    };

    if (force) {
      await send();
    } else {
      await this.mutex.runExclusive(send);
    }
  }
}
