import { get, readable, writable } from "svelte/store";
import {
  AppConfigSchema,
  CsvParamsSchema,
  UserFontSchema,
  UserIconSchema,
  type CsvParams,
  type UserFont,
  type UserIcon,
  type AppConfig,
  type AutomationProps,
  type ConnectionState,
  type ConnectionType,
} from "$/types";
import { Utils } from "@mmote/niimbluelib";
import {
  instantiatePrinterClient,
  type PrinterClient,
  type PrinterHeartbeatData,
  type PrinterInfo,
  type PrinterMetadata,
  type PrinterRfidInfo,
} from "$/printers";
import { Toasts } from "$/utils/toasts";
import { tr } from "$/utils/i18n";
import { LocalStoragePersistence, writablePersisted } from "$/utils/persistence";
import { APP_CONFIG_DEFAULTS, CSV_DEFAULT, OBJECT_DEFAULTS_TEXT } from "$/defaults";
import z from "zod";
import { FileUtils } from "$/utils/file_utils";

export const fontCache = writable<string[]>([OBJECT_DEFAULTS_TEXT.fontFamily]);
export const appConfig = writablePersisted<AppConfig>("config", AppConfigSchema, APP_CONFIG_DEFAULTS);
export const userIcons = writablePersisted<UserIcon[]>("user_icons", z.array(UserIconSchema), []);
export const userFonts = writablePersisted<UserFont[]>("user_fonts", z.array(UserFontSchema), []);
export const loadedFonts = writable<FontFace[]>([]);

export const connectionState = writable<ConnectionState>("disconnected");
export const connectedPrinterName = writable<string>("");
export const printerClient = writable<PrinterClient>();
export const heartbeatData = writable<PrinterHeartbeatData>();
export const printerInfo = writable<PrinterInfo>();
export const rfidInfo = writable<PrinterRfidInfo | undefined>();
export const ribbonRfidInfo = writable<PrinterRfidInfo | undefined>();
export const printerMeta = writable<PrinterMetadata | undefined>();
export const heartbeatFails = writable<number>(0);
export const csvData = writablePersisted<CsvParams>("csv_params", CsvParamsSchema, { data: CSV_DEFAULT });

userFonts.subscribe(FileUtils.loadFonts);

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

export const refreshRfidInfo = () => {
  const client = get(printerClient);

  if (!client) {
    return;
  }

  client.getRfidInfo().then(rfidInfo.set).catch(console.error);

  client
    .getRibbonRfidInfo()
    .then(ribbonRfidInfo.set)
    .catch(() => {});
};

export const initClient = (connectionType: ConnectionType) => {
  printerClient.update((prevClient: PrinterClient) => {
    let newClient: PrinterClient = prevClient;

    if (prevClient === undefined || prevClient.connectionType !== connectionType) {
      if (prevClient !== undefined) {
        prevClient.disconnect();
      }

      newClient = instantiatePrinterClient(connectionType);

      const conf = get(appConfig);

      if (conf.packetIntervalMs !== undefined) {
        newClient.setPacketInterval(conf.packetIntervalMs);
      }

      newClient.on("packetsent", (e) => {
        const commandName = newClient.getPacketCommandName("request", e.packet.command);
        console.log(`>> ${Utils.bufToHex(e.packet.toBytes())} (${commandName})`);
      });

      newClient.on("packetreceived", (e) => {
        const commandName = newClient.getPacketCommandName("response", e.packet.command);
        console.log(`<< ${Utils.bufToHex(e.packet.toBytes())} (${commandName})`);
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
          if (
            prev?.paperRfidSuccess !== e.data?.paperRfidSuccess ||
            prev?.ribbonRfidSuccess !== e.data?.ribbonRfidSuccess
          ) {
            refreshRfidInfo();
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
