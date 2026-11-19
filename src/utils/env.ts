import { Utils } from "@mmote/niimbluelib";

/**
 * Check if the app runs as a standalone application (Capacitor or Tauri)
 * instead of being served by a web server.
 *
 * Link based features (like label URL export) do not work in such builds,
 * because there is no reachable web origin.
 */
export const isStandaloneApp = (): boolean =>
  Utils.getAvailableTransports().capacitorBle || "__TAURI__" in window;
