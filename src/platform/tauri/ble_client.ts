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
import {
  checkPermissions,
  connect as bleConnect,
  getAdapterState,
  type BleConnection,
  type BleService,
} from "@mnlphlp/plugin-blec";
import { requestBleDevice } from "./picker";

/**
 * @category Client
 */
export interface NiimbotTauriBleClientConnectOptions {
  /** Skip the device picker dialog and connect to this address. */
  deviceId?: string;
  /** Human-readable device name to store in {@link ConnectionInfo}. */
  deviceName?: string;
}

/** BLE characteristic property flags, see btleplug's `CharPropFlags`. */
const CHAR_PROP_WRITE_WITHOUT_RESPONSE = 0x04;
const CHAR_PROP_NOTIFY = 0x10;

const findSuitableCharacteristic = (
  services: BleService[],
): { service: string; characteristic: string } | undefined => {
  for (const service of services) {
    // Same heuristic as the Web Bluetooth client.
    if (service.uuid.length < 5) {
      continue;
    }

    for (const characteristic of service.characteristics) {
      const canNotify = (characteristic.properties & CHAR_PROP_NOTIFY) !== 0;
      const canWriteWithoutResponse =
        (characteristic.properties & CHAR_PROP_WRITE_WITHOUT_RESPONSE) !== 0;

      if (canNotify && canWriteWithoutResponse) {
        return { service: service.uuid, characteristic: characteristic.uuid };
      }
    }
  }

  return undefined;
};

/**
 * Uses the native Bluetooth stack through
 * [tauri-plugin-blec](https://github.com/MnlPhlp/tauri-plugin-blec).
 *
 * This client is used by the desktop builds, where the Web Bluetooth API is
 * not available.
 *
 * @category Client
 */
export class NiimbotTauriBleClient extends NiimbotAbstractClient {
  private connection?: BleConnection;
  private serviceUuid?: string;
  private characteristicUuid?: string;
  private deviceName?: string;

  async connect(options?: NiimbotTauriBleClientConnectOptions): Promise<ConnectionInfo> {
    await this.disconnect();

    const adapterState = await getAdapterState();

    if (adapterState !== "On") {
      throw new Error(adapterState === "Off" ? "Bluetooth adapter is off" : "No Bluetooth adapter found");
    }

    if (!(await checkPermissions(false))) {
      throw new Error("Bluetooth permission denied");
    }

    let address = options?.deviceId;
    let name = options?.deviceName;

    if (address === undefined) {
      const device = await requestBleDevice();

      if (device === null) {
        // A cancel is not an error, the connector ignores AbortError.
        throw new DOMException("Bluetooth device selection cancelled", "AbortError");
      }

      address = device.address;
      name = device.name;
    }

    this.deviceName = name || address;

    try {
      this.connection = await bleConnect(address, () => this.onBleDisconnect());

      const services = await this.connection.listServices();
      const channel = findSuitableCharacteristic(services);

      if (channel === undefined) {
        throw new Error("Unable to find suitable channel characteristic");
      }

      this.serviceUuid = channel.service;
      this.characteristicUuid = channel.characteristic;

      if (this.debug) {
        console.log("Suitable channel found:", channel);
      }

      await this.connection.subscribe(channel.characteristic, channel.service, (data) => {
        this.processRawPacket(new Uint8Array(data));
      });

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

  private onBleDisconnect(): void {
    if (this.connection === undefined) {
      return;
    }

    this.stopHeartbeat();
    this.connection = undefined;
    this.serviceUuid = undefined;
    this.characteristicUuid = undefined;
    this.deviceName = undefined;
    this.emit("disconnect", new DisconnectEvent());
  }

  isConnected(): boolean {
    return this.connection !== undefined && this.characteristicUuid !== undefined;
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();

    const connection = this.connection;
    const service = this.serviceUuid;
    const characteristic = this.characteristicUuid;
    const wasConnected = this.isConnected();

    this.connection = undefined;
    this.serviceUuid = undefined;
    this.characteristicUuid = undefined;
    this.deviceName = undefined;

    if (connection !== undefined) {
      if (characteristic !== undefined) {
        try {
          await connection.unsubscribe(characteristic, service);
        } catch (e) {
          console.warn("Unable to unsubscribe from BLE characteristic:", e);
        }
      }

      try {
        await connection.disconnect();
      } catch (e) {
        console.warn("Unable to disconnect from BLE device:", e);
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

      await this.connection!.send(
        this.characteristicUuid!,
        Array.from(data),
        "withoutResponse",
        this.serviceUuid,
      );

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
    return "platform-ble" as NiimbotClientType;
  }
}
