import { NiimbotCapacitorBleClient, type ConnectionInfo, type NiimbotAbstractClient } from "@mmote/niimbluelib";
import type { ConnectionType } from "$/types";
import type { PlatformConnectOptions, PlatformTransport } from "$/platform/types";

/** The web build has no host-provided transports and relies on the browser APIs. */
export const webTransportsEnabled = true;

/** The web build has no host-provided transports. */
export const platformTransports: PlatformTransport[] = [];

/** The web build can only use transports implemented by niimbluelib itself. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createPlatformClient = (_type: ConnectionType): NiimbotAbstractClient | undefined => undefined;

/** The web build has no host specific connection options, but the Capacitor client accepts a device ID. */
export const connectPlatformClient = (
  client: NiimbotAbstractClient,
  options?: PlatformConnectOptions,
): Promise<ConnectionInfo> =>
  client instanceof NiimbotCapacitorBleClient && options?.deviceId !== undefined
    ? client.connect({ deviceId: options.deviceId })
    : client.connect();
