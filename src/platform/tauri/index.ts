import type { ConnectionInfo, NiimbotAbstractClient } from "@mmote/niimbluelib";
import type { ConnectionType } from "$/types";
import type { PlatformConnectOptions, PlatformTransport } from "$/platform/types";
import { NiimbotTauriBleClient } from "./ble_client";
import { NiimbotTauriSerialClient } from "./serial_client";

/** Native transports are provided by the host, so the browser transports are not offered. */
export const webTransportsEnabled = false;

/** Transports provided by the Tauri host. */
export const platformTransports: PlatformTransport[] = [
  {
    type: "platform-ble",
    labelKey: "connector.bluetooth",
    icon: "bluetooth",
  },
  {
    type: "platform-serial",
    labelKey: "connector.serial",
    icon: "usb",
  },
];

export const createPlatformClient = (type: ConnectionType): NiimbotAbstractClient | undefined => {
  if (type === "platform-ble") {
    return new NiimbotTauriBleClient();
  }

  if (type === "platform-serial") {
    return new NiimbotTauriSerialClient();
  }

  return undefined;
};

/** Connect a Tauri client, optionally skipping the device picker. */
export const connectPlatformClient = (
  client: NiimbotAbstractClient,
  options?: PlatformConnectOptions,
): Promise<ConnectionInfo> =>
  client instanceof NiimbotTauriBleClient || client instanceof NiimbotTauriSerialClient
    ? client.connect(options)
    : client.connect();
