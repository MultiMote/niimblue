/**
 * Check if the app runs as a standalone application (Tauri)
 * instead of being served by a web server.
 *
 * Link based features (like label URL export) do not work in such builds,
 * because there is no reachable web origin.
 */
export const isStandaloneApp = (): boolean => "__TAURI__" in window;
