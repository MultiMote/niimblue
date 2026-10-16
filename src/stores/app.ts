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
import {
  CombinedRfidInfo,
  RequestCommandId,
  ResponseCommandId,
  Utils,
  instantiateClient,
  type HeartbeatData,
  type NiimbotAbstractClient,
  type PrinterInfo,
  type PrinterModelMeta,
} from "@mmote/niimbluelib";
import { LocalStoragePersistence, writablePersisted } from "$/utils/persistence";
import { APP_CONFIG_DEFAULTS, CSV_DEFAULT, OBJECT_DEFAULTS_TEXT } from "$/defaults";
import z from "zod";
import { FileUtils } from "$/utils/file_utils";
import { createPrinterInfo } from "@mmote/niimbluelib/dist/cjs/client/abstract_client";

export const fontCache = writable<string[]>([OBJECT_DEFAULTS_TEXT.fontFamily]);
export const appConfig = writablePersisted<AppConfig>("config", AppConfigSchema, APP_CONFIG_DEFAULTS);
export const userIcons = writablePersisted<UserIcon[]>("user_icons", z.array(UserIconSchema), []);
export const userFonts = writablePersisted<UserFont[]>("user_fonts", z.array(UserFontSchema), []);
export const loadedFonts = writable<FontFace[]>([]);

export const connectionState = writable<ConnectionState>("disconnected");
export const connectedPrinterName = writable<string>("");
export const printerClient = writable<NiimbotAbstractClient>();
export const heartbeatData = writable<HeartbeatData>();
export const printerInfo = writable<PrinterInfo>();
export const rfidInfo = writable<CombinedRfidInfo>({});
export const printerMeta = writable<PrinterModelMeta | undefined>();
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

export const initClient = (connectionType: ConnectionType) => {
  printerClient.update((prevClient: NiimbotAbstractClient) => {
    let newClient: NiimbotAbstractClient = prevClient;

    if (connectionType !== prevClient?.getType()) {
      if (prevClient !== undefined) {
        prevClient.disconnect();
      }

      newClient = instantiateClient(connectionType);

      const conf = get(appConfig);

      if (conf.packetIntervalMs !== undefined) {
        newClient.setPacketInterval(conf.packetIntervalMs);
      }

      newClient.on("packetsent", (e) => {
        console.log(`>> ${Utils.bufToHex(e.packet.toBytes())} (${RequestCommandId[e.packet.command]})`);
      });

      newClient.on("packetreceived", (e) => {
        console.log(`<< ${Utils.bufToHex(e.packet.toBytes())} (${ResponseCommandId[e.packet.command]})`);
      });

      newClient.on("connect", (e) => {
        heartbeatFails.set(0);
        connectionState.set("connected");
        connectedPrinterName.set(e.info.deviceName ?? "unknown");
      });

      newClient.on("printerinfofetched", (e) => {
        printerInfo.set(e.info);
        printerMeta.set(newClient.getModelMetadata());
      });

      newClient.on("disconnect", () => {
        connectionState.set("disconnected");
        connectedPrinterName.set("");
        printerInfo.set(createPrinterInfo());
        printerMeta.set(undefined);
      });

      newClient.on("heartbeat", (e) => {
        heartbeatFails.set(0);
        heartbeatData.set(e.data);
      });

      newClient.on("rfidinfofetched", (e) => {
        rfidInfo.set(e.info);
      });

      newClient.on("heartbeatfailed", (e) => {
        heartbeatFails.set(e.failedAttempts);
        console.warn(`Heartbeat failed ${e.failedAttempts}/${newClient.getHeartbeatMaxFails()}`);
      });
    }

    return newClient;
  });
};
