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

class BleConfiguration {
  public static readonly SERVICE: string = "e7810a71-73ae-499d-8c15-faa9aef0c3f2";
  public static readonly CHARACTERISTIC: string = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f";
  public static readonly FILTER: BluetoothLEScanFilter[] = [
    { namePrefix: "D" },
    { namePrefix: "B" },
    { services: [BleConfiguration.SERVICE] },
  ];
}

export class NiimbotBluetoothClient extends NiimbotAbstractClient {
  private gattServer?: BluetoothRemoteGATTServer = undefined;
  private channel?: BluetoothRemoteGATTCharacteristic = undefined;
  private mutex: Mutex = new Mutex();

  public async connect(): Promise<ConnectionInfo> {
    await this.disconnect();

    const options: RequestDeviceOptions = {
      filters: BleConfiguration.FILTER,
    };
    const device: BluetoothDevice = await navigator.bluetooth.requestDevice(options);

    if (device.gatt === undefined) {
      throw new Error("Device has no Bluetooth Generic Attribute Profile");
    }

    const disconnectListener = () => {
      this.gattServer = undefined;
      this.channel = undefined;
      this.info = {};
      this.stopHeartbeat();
      this.dispatchTypedEvent("disconnect", new DisconnectEvent());
      device.removeEventListener("gattserverdisconnected", disconnectListener);
    };

    device.addEventListener("gattserverdisconnected", disconnectListener);

    const gattServer: BluetoothRemoteGATTServer = await device.gatt.connect();

    const service: BluetoothRemoteGATTService = await gattServer.getPrimaryService(BleConfiguration.SERVICE);

    const channel: BluetoothRemoteGATTCharacteristic = await service.getCharacteristic(BleConfiguration.CHARACTERISTIC);

    channel.addEventListener("characteristicvaluechanged", (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      const data = new Uint8Array(target.value!.buffer);
      const packet = NiimbotPacket.fromBytes(data);

      this.dispatchTypedEvent("rawpacketreceived", new RawPacketReceivedEvent(data));
      this.dispatchTypedEvent("packetreceived", new PacketReceivedEvent(packet));

      if (!(packet.command in ResponseCommandId)) {
        console.warn(`Unknown response command: 0x${Utils.numberToHex(packet.command)}`);
      }
    });

    await channel.startNotifications();

    this.gattServer = gattServer;
    this.channel = channel;

    try {
      await this.initialNegotiate();
      await this.fetchPrinterInfo();
    } catch (e) {
      console.error("Unable to fetch printer info.");
      console.error(e);
    }

    const result: ConnectionInfo = {
      deviceName: device.name,
      result: this.info.connectResult ?? ConnectResult.FirmwareErrors,
    };

    this.dispatchTypedEvent("connect", new ConnectEvent(result));

    return result;
  }

  public isConnected(): boolean {
    return this.gattServer !== undefined && this.channel !== undefined;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async disconnect() {
    this.stopHeartbeat();
    this.gattServer?.disconnect();
    this.gattServer = undefined;
    this.channel = undefined;
    this.info = {};
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
      if (this.channel === undefined) {
        throw new Error("Channel is closed");
      }
      await Utils.sleep(this.packetIntervalMs);
      await this.channel.writeValueWithoutResponse(data);
      this.dispatchTypedEvent("rawpacketsent", new RawPacketSentEvent(data));
    };

    if (force) {
      await send();
    } else {
      await this.mutex.runExclusive(send);
    }
  }
}
