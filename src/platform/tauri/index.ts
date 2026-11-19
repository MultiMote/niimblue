import type { ConnectionInfo, NiimbotAbstractClient } from "@mmote/niimbluelib";
import type { ConnectionType } from "$/types";
import type { PlatformConnectOptions, PlatformTransport } from "$/platform/types";
import { NiimbotTauriBleClient } from "./ble_client";

/** Transports provided by the Tauri host. */
export const platformTransports: PlatformTransport[] = [
  {
    type: "platform-ble",
    labelKey: "connector.bluetooth",
    icon: "bluetooth",
  },
];

export const createPlatformClient = (type: ConnectionType): NiimbotAbstractClient | undefined => {
  if (type === "platform-ble") {
    return new NiimbotTauriBleClient();
  }

  return undefined;
};

/** Connect a Tauri client, optionally skipping the device picker. */
export const connectPlatformClient = (
  client: NiimbotAbstractClient,
  options?: PlatformConnectOptions,
): Promise<ConnectionInfo> =>
  client instanceof NiimbotTauriBleClient ? client.connect(options) : client.connect();
