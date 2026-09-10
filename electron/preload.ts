import { contextBridge, ipcRenderer } from "electron";

const api = {
  platform: process.platform,
  isPackaged: process.versions as unknown as boolean,
  onMenuAction: (cb: (action: string) => void) => {
    const handler = (_e: unknown, action: string) => cb(action);
    ipcRenderer.on("menu-action", handler);
    return () => ipcRenderer.off("menu-action", handler);
  },
};

contextBridge.exposeInMainWorld("electronAPI", api);

export type ElectronAPI = typeof api;
