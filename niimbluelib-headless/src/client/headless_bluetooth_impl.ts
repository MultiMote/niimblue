import { Mutex } from "async-mutex";
import { BluetoothSerialPort } from "bluetooth-serial-port";
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

// bluetooth-serial-port has no disconnect events
export class NiimbotHeadlessBluetoothClient extends NiimbotAbstractClient {
  private mutex: Mutex = new Mutex();
  private mac: string;
  private port: BluetoothSerialPort;

  constructor(mac: string) {
    super();
    this.mac = mac;
    this.port = new BluetoothSerialPort();
  }

  private async tryConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const rawPacketReceivedWrapped = this.rawPacketReceived.bind(this);

      const onConnect = async () => {
        this.port.on("data", rawPacketReceivedWrapped);
        resolve();
      };

      this.port.findSerialPortChannel(
        this.mac,
        (channel: number) => {
          this.port.connect(this.mac, channel, onConnect, (err?: Error) => {
            if (err) {
              reject(err);
            }
          });
        },
        () => {
          reject(new Error("No device found"));
        }
      );
    });
  }

  public async connect(): Promise<ConnectionInfo> {
    await this.disconnect();
    await this.tryConnect();

    try {
      await this.initialNegotiate();
      await this.fetchPrinterInfo();
    } catch (e) {
      console.error("Unable to fetch printer info.");
      console.error(e);
    }

    const result: ConnectionInfo = {
      deviceName: `Bluetooth (${this.mac})`,
      result: this.info.connectResult ?? ConnectResult.FirmwareErrors,
    };

    this.dispatchTypedEvent("connect", new ConnectEvent(result));

    return result;
  }

  private rawPacketReceived(buf: Buffer) {
    if (buf.length === 0) {
      return;
    }

    const data = Uint8Array.from(buf);
    const packet = NiimbotPacket.fromBytes(data);

    this.dispatchTypedEvent("rawpacketreceived", new RawPacketReceivedEvent(data));
    this.dispatchTypedEvent("packetreceived", new PacketReceivedEvent(packet));

    if (!(packet.command in ResponseCommandId)) {
      console.warn(`Unknown response command: 0x${Utils.numberToHex(packet.command)}`);
    }
  }

  public isConnected(): boolean {
    return this.port.isOpen();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async disconnect() {
    this.stopHeartbeat();

    if (this.port.isOpen()) {
      this.port.close();
      this.dispatchTypedEvent("disconnect", new DisconnectEvent());
    }
  }

  /**
   * Send packet and wait for response.
   * If packet.responsePacketCommandId is defined, it will wait for packet with this command id.
   */
  public async sendPacketWaitResponse(packet: NiimbotPacket, timeoutMs?: number): Promise<NiimbotPacket> {
    return this.mutex.runExclusive(async () => {
      await this.sendPacket(packet, true);

      if (packet.oneWay) {
        return new NiimbotPacket(ResponseCommandId.Invalid, []); // or undefined is better?
      }

      // what if response received at this point?

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
        this.disconnect();
        throw new Error("Disconnected");
      }

      await Utils.sleep(this.packetIntervalMs);

      this.port.write(Buffer.from(data), (err?: Error) => {
        if (err) {
          throw err;
        }
      });

      this.dispatchTypedEvent("rawpacketsent", new RawPacketSentEvent(data));
    };

    if (force) {
      await send();
    } else {
      await this.mutex.runExclusive(send);
    }
  }
}
