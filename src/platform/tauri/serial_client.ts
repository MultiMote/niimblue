import {
  ConnectEvent,
  ConnectResult,
  DisconnectEvent,
  NiimbotAbstractClient,
  RawPacketSentEvent,
  Utils,
  type ConnectionInfo,
  type NiimbotClientType,
} from "@mmote/niimbluelib";
import { SerialPort } from "tauri-plugin-serialplugin-api";
import { requestSerialDevice } from "./picker";

/**
 * @category Client
 */
export interface NiimbotTauriSerialClientConnectOptions {
  /** Skip the port picker dialog and connect to this port path (COM3, /dev/ttyUSB0, ...). */
  deviceId?: string;
  /** Human-readable device name to store in {@link ConnectionInfo}. */
  deviceName?: string;
}

/** Printers speak at 115200 baud, see NiimbotSerialClient in niimbluelib. */
const BAUD_RATE = 115200;

/**
 * Uses the native serial ports through
 * [tauri-plugin-serialplugin](https://github.com/s00d/tauri-plugin-serialplugin).
 *
 * This client is used by the desktop builds, where the Web Serial API is
 * not available.
 *
 * @category Client
 */
export class NiimbotTauriSerialClient extends NiimbotAbstractClient {
  private port?: SerialPort;
  private watchActive = false;
  private deviceName?: string;

  async connect(options?: NiimbotTauriSerialClientConnectOptions): Promise<ConnectionInfo> {
    await this.disconnect();

    let path = options?.deviceId;
    let name = options?.deviceName;

    if (path === undefined) {
      const device = await requestSerialDevice();

      if (device === null) {
        // A cancel is not an error, the connector ignores AbortError.
        throw new DOMException("Serial port selection cancelled", "AbortError");
      }

      path = device.path;
      name = device.name;
    }

    this.deviceName = name || path;

    try {
      this.port = new SerialPort({ path, baudRate: BAUD_RATE });
      await this.port.open();

      if (this.debug) {
        console.log("Serial port opened:", path);
      }

      await this.port.watch(
        {
          onData: (data) => {
            if (!(data instanceof Uint8Array)) {
              return;
            }

            if (this.debug) {
              console.info(`<< serial chunk ${Utils.bufToHex(data)}`);
            }

            this.processRawPacket(data);
          },
          onDisconnect: () => this.onSerialDisconnect(),
        },
        { decode: false },
      );

      this.watchActive = true;

      await this.negotiateAndGetPrinterInfo(() => void this.disconnect());
    } catch (e) {
      await this.disconnect();
      throw e;
    }

    const result: ConnectionInfo = {
      deviceName: this.deviceName,
      result: this.printerInfo.connectResult ?? ConnectResult.FirmwareErrors,
    };

    this.emit("connect", new ConnectEvent(result));
    return result;
  }

  private onSerialDisconnect(): void {
    if (this.port === undefined) {
      return;
    }

    const port = this.port;

    this.stopHeartbeat();
    this.port = undefined;
    this.watchActive = false;
    this.deviceName = undefined;
    this.emit("disconnect", new DisconnectEvent());

    void port.close().catch((e) => console.warn("Unable to close serial port after disconnect:", e));
  }

  isConnected(): boolean {
    return this.port !== undefined && this.watchActive;
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();

    const port = this.port;
    const wasConnected = this.isConnected();

    this.port = undefined;
    this.watchActive = false;
    this.deviceName = undefined;

    if (port !== undefined) {
      try {
        await port.close();
      } catch (e) {
        console.warn("Unable to close serial port:", e);
      }
    }

    if (wasConnected) {
      this.emit("disconnect", new DisconnectEvent());
    }
  }

  async sendRaw(data: Uint8Array, force?: boolean): Promise<void> {
    const send = async () => {
      if (!this.isConnected()) {
        throw new Error("Channel is closed");
      }

      await Utils.sleep(this.packetIntervalMs);

      await this.port!.writeBinary(data);

      this.emit("rawpacketsent", new RawPacketSentEvent(data));
    };

    if (force) {
      await send();
    } else {
      await this.mutex.runExclusive(send);
    }
  }

  getType(): NiimbotClientType {
    // niimbluelib does not know about host-provided clients yet.
    return "platform-serial" as NiimbotClientType;
  }
}
