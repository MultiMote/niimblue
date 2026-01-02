import { get, readable, writable } from "svelte/store";
import { AppConfigSchema, type AppConfig, type AutomationProps, type ConnectionState, type ConnectionType } from "$/types";
import {
  NiimbotBluetoothClient,
  NiimbotCapacitorBleClient,
  NiimbotSerialClient,
  RequestCommandId,
  ResponseCommandId,
  Utils,
  instantiateClient,
  type HeartbeatData,
  type NiimbotAbstractClient,
  type PrinterInfo,
  type PrinterModelMeta,
  type RfidInfo,
} from "@mmote/niimbluelib";
import { Toasts } from "$/utils/toasts";
import { tr } from "$/utils/i18n";
import { LocalStoragePersistence, writablePersisted } from "$/utils/persistence";
import { APP_CONFIG_DEFAULTS, OBJECT_DEFAULTS_TEXT } from "$/defaults";

export const fontCache = writable<string[]>([OBJECT_DEFAULTS_TEXT.fontFamily]);
export const appConfig = writablePersisted<AppConfig>("config", AppConfigSchema, APP_CONFIG_DEFAULTS);

export const connectionState = writable<ConnectionState>("disconnected");
export const connectedPrinterName = writable<string>("");
export const printerClient = writable<NiimbotAbstractClient>();
export const heartbeatData = writable<HeartbeatData>();
export const printerInfo = writable<PrinterInfo>();
export const rfidInfo = writable<RfidInfo | undefined>();
export const printerMeta = writable<PrinterModelMeta | undefined>();
export const heartbeatFails = writable<number>(0);
export const automation = readable<AutomationProps | undefined>(
  (() => {
    try {
      return LocalStoragePersistence.loadAutomation() ?? undefined;
    } catch (e) {
      console.error(e);
    }
    return undefined;
  })(),
);

export const initClient = (connectionType: ConnectionType) => {
  printerClient.update((prevClient: NiimbotAbstractClient) => {
    let newClient: NiimbotAbstractClient = prevClient;

    if (
      prevClient === undefined ||
      (connectionType !== "bluetooth" && prevClient instanceof NiimbotBluetoothClient) ||
      (connectionType !== "serial" && prevClient instanceof NiimbotSerialClient) ||
      (connectionType !== "capacitor-ble" && prevClient instanceof NiimbotCapacitorBleClient)
    ) {
      if (prevClient !== undefined) {
        prevClient.disconnect();
      }

      newClient = instantiateClient(connectionType);

      newClient.on("packetsent", (e) => {
        console.log(`>> ${Utils.bufToHex(e.packet.toBytes())} (${RequestCommandId[e.packet.command]})`);
      });

      newClient.on("packetreceived", (e) => {
        console.log(`<< ${Utils.bufToHex(e.packet.toBytes())} (${ResponseCommandId[e.packet.command]})`);
      });

      newClient.on("connect", (e) => {
        console.log("onConnect");
        heartbeatFails.set(0);
        connectionState.set("connected");
        connectedPrinterName.set(e.info.deviceName ?? "unknown");
      });

      newClient.on("printerinfofetched", (e) => {
        console.log("printerInfoFetched");
        printerInfo.set(e.info);
        printerMeta.set(newClient.getModelMetadata());
      });

      newClient.on("disconnect", () => {
        console.log("onDisconnect");
        connectionState.set("disconnected");
        connectedPrinterName.set("");
        printerInfo.set({});
        printerMeta.set(undefined);
      });

      newClient.on("heartbeat", (e) => {
        heartbeatFails.set(0);
        heartbeatData.update((prev) => {
          if (prev?.rfidReadState !== e.data?.rfidReadState) {
            newClient.abstraction.rfidInfo().then(rfidInfo.set).catch(console.error);
          }
          return e.data;
        });
      });

      newClient.on("heartbeatfailed", (e) => {
        const maxFails = 5;
        heartbeatFails.set(e.failedAttempts);

        console.warn(`Heartbeat failed ${e.failedAttempts}/${maxFails}`);
        if (e.failedAttempts >= maxFails) {
          Toasts.error(get(tr)("connector.disconnect.heartbeat"));
          newClient.disconnect();
        }
      });
    }

    return newClient;
  });
};
