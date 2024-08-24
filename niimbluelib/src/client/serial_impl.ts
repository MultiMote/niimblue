import { Mutex } from "async-mutex";
import { ConnectionInfo, NiimbotAbstractClient } from ".";
import { ConnectResult, NiimbotPacket, ResponseCommandId } from "../packets";
import { Utils } from "../utils";
import {
  ConnectEvent,
  DisconnectEvent,
  PacketReceivedEvent,
  RawPacketReceivedEvent,
  RawPacketSentEvent,
} from "./events";

/** WIP. Uses serial communication, Works worse than NiimbotBluetoothClient at the moment, events are not firing */
export class NiimbotSerialClient extends NiimbotAbstractClient {
  private port?: SerialPort = undefined;
  private writer?: WritableStreamDefaultWriter<Uint8Array> = undefined;
  private reader?: ReadableStreamDefaultReader<Uint8Array> = undefined;
  private mutex: Mutex = new Mutex();

  public async connect(): Promise<ConnectionInfo> {
    await this.disconnect();

    const _port: SerialPort = await navigator.serial.requestPort();

    _port.addEventListener("disconnect", () => {
      this.port = undefined;
      console.log("serial disconnect event");
      this.dispatchTypedEvent("disconnect", new DisconnectEvent());
    });

    await _port.open({ baudRate: 115200 });

    if (_port.readable === null) {
      throw new Error("Port is not readable");
    }

    if (_port.writable === null) {
      throw new Error("Port is not writable");
    }

    this.port = _port;
    const info = _port.getInfo();
    this.writer = _port.writable.getWriter();
    this.reader = _port.readable.getReader();

    setTimeout(() => {
      void (async () => {
        await this.waitSerialData();
      })();
    }, 1); // todo: maybe some other way exists

    try {
      await this.initialNegotiate();
      await this.fetchPrinterInfo();
    } catch (e) {
      console.error("Unable to fetch printer info (is it turned on?).");
      console.error(e);
    }

    const result: ConnectionInfo = {
      deviceName: `Serial (VID:${info.usbVendorId?.toString(16)} PID:${info.usbProductId?.toString(16)})`,
      result: this.info.connectResult ?? ConnectResult.FirmwareErrors,
    };

    this.dispatchTypedEvent("connect", new ConnectEvent(result));
    return result;
  }

  private async waitSerialData() {
    let buf = new Uint8Array();

    while (true) {
      try {
        const result = await this.reader!.read();
        if (result.value) {
          // console.info(`<< serial chunk ${Utils.bufToHex(result.value)}`);

          const newBuf = new Uint8Array(buf.length + result.value.length);
          newBuf.set(buf, 0);
          newBuf.set(result.value, buf.length);
          buf = newBuf;
        }

        if (result.done) {
          console.log("done");
          break;
        }
      } catch (e) {
        break;
      }

      try {
        const packets: NiimbotPacket[] = NiimbotPacket.fromBytesMultiPacket(buf);

        if (packets.length > 0) {
          this.dispatchTypedEvent("rawpacketreceived", new RawPacketReceivedEvent(buf));

          packets.forEach((p) => {
            this.dispatchTypedEvent("packetreceived", new PacketReceivedEvent(p));
          });

          buf = new Uint8Array();
        }
      } catch (e) {
        // console.info(`Incomplete packet, ignoring:${Utils.bufToHex(buf)}`);
      }
    }
  }

  public async disconnect() {
    if (this.writer !== undefined) {
      this.writer.releaseLock();
    }

    if (this.reader !== undefined) {
      this.reader.releaseLock();
    }

    if (this.port !== undefined) {
      await this.port.close();
      this.dispatchTypedEvent("disconnect", new DisconnectEvent());
    }

    this.port = undefined;
    this.writer = undefined;
  }

  public isConnected(): boolean {
    return this.port !== undefined && this.writer !== undefined;
  }

  public async sendPacketWaitResponse(packet: NiimbotPacket, timeoutMs: number = 1000): Promise<NiimbotPacket> {
    if (!this.port?.readable || !this.port?.writable) {
      throw new Error("Port is not readable/writable");
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
      if (this.writer === undefined) {
        throw new Error("Port is not writable");
      }
      await Utils.sleep(this.packetIntervalMs); // https://github.com/MultiMote/niimblue/issues/5
      await this.writer.write(data);
      this.dispatchTypedEvent("rawpacketsent", new RawPacketSentEvent(data));
    };

    if (force) {
      await send();
    } else {
      await this.mutex.runExclusive(send);
    }
  }
}
