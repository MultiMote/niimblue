import { writable, get } from "svelte/store";
import {
  NiimbotSerialClient,
  RequestCommandId,
  ResponseCommandId,
  Utils,
  type HeartbeatData,
  type NiimbotAbstractClient,
  type PrinterInfo,
  type PrinterModelMeta,
  type RfidInfo,
} from "@mmote/niimbluelib";
import { toast } from "$lib/toast";

export type ConnectionState = "disconnected" | "connecting" | "connected";

export const connectionState = writable<ConnectionState>("disconnected");
export const connectedPrinterName = writable<string>("");
export const printerClient = writable<NiimbotAbstractClient | undefined>(undefined);
export const heartbeatData = writable<HeartbeatData | undefined>(undefined);
export const printerInfo = writable<PrinterInfo>({});
export const printerMeta = writable<PrinterModelMeta | undefined>(undefined);
export const rfidInfo = writable<RfidInfo | undefined>(undefined);
export const ribbonRfidInfo = writable<RfidInfo | undefined>(undefined);
export const heartbeatFails = writable<number>(0);
export const packetLog = writable<string[]>([]);

const MAX_LOG = 200;

const refreshRfidInfo = () => {
  const client = get(printerClient);
  if (!client) return;
  client.abstraction.rfidInfo().then(rfidInfo.set).catch(console.error);
  client.abstraction.rfidInfo2().then(ribbonRfidInfo.set).catch(() => {});
};

export const initClient = () => {
  printerClient.update((prev) => {
    if (prev) return prev;
    const client = new NiimbotSerialClient();

    client.on("packetsent", (e: any) => {
      packetLog.update((l) => [...l, `>> ${Utils.bufToHex(e.packet.toBytes())} (${RequestCommandId[e.packet.command]})`].slice(-MAX_LOG));
    });
    client.on("packetreceived", (e: any) => {
      packetLog.update((l) => [...l, `<< ${Utils.bufToHex(e.packet.toBytes())} (${ResponseCommandId[e.packet.command]})`].slice(-MAX_LOG));
    });

    client.on("connect", (e: any) => {
      heartbeatFails.set(0);
      connectionState.set("connected");
      connectedPrinterName.set(e.info.deviceName ?? "unknown");
    });

    client.on("disconnect", () => {
      connectionState.set("disconnected");
      connectedPrinterName.set("");
      printerInfo.set({});
      printerMeta.set(undefined);
    });

    client.on("printerinfofetched", (e: any) => {
      printerInfo.set(e.info);
      printerMeta.set(client.getModelMetadata());
    });

    client.on("heartbeat", (e: any) => {
      heartbeatFails.set(0);
      heartbeatData.update((prev) => {
        if (prev?.paperRfidSuccess !== e.data?.paperRfidSuccess || prev?.ribbonRfidSuccess !== e.data?.ribbonRfidSuccess) {
          refreshRfidInfo();
        }
        return e.data;
      });
    });

    client.on("heartbeatfailed", (e: any) => {
      const max = 5;
      heartbeatFails.set(e.failedAttempts);
      if (e.failedAttempts >= max) {
        toast(`Heartbeat lost (${e.failedAttempts}/${max}), disconnecting`, "error");
        client.disconnect();
      }
    });

    return client;
  });
};

export const connect = async () => {
  initClient();
  const client = get(printerClient);
  if (!client) return;
  connectionState.set("connecting");
  try {
    await client.connect();
  } catch (e) {
    connectionState.set("disconnected");
    toast(`${e}`, "error");
  }
};

export const disconnect = () => {
  get(printerClient)?.disconnect();
};

export const fetchPrinterInfo = async () => {
  await get(printerClient)?.fetchPrinterInfo();
};

export const startHeartbeat = () => get(printerClient)?.startHeartbeat();
export const stopHeartbeat = () => get(printerClient)?.stopHeartbeat();
