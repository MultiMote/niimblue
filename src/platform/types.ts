import type { MaterialIcon } from "material-icons";
import type { TranslationKey } from "$/locale";
import type { ConnectionType } from "$/types";

/** A connection transport provided by the host application (not from the browser). */
export interface PlatformTransport {
  type: ConnectionType;
  labelKey: TranslationKey;
  icon: MaterialIcon;
}

/** Options for connecting a printer client. */
export interface PlatformConnectOptions {
  /** Skip the device picker and connect to this device address or ID. */
  deviceId?: string;
}
