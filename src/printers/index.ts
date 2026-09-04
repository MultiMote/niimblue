import type { ConnectionType } from "$/types";
import type { PrinterClient } from "$/printers/types";
import { NiimbotPrinterClient } from "$/printers/niimbot_adapter";

export const instantiatePrinterClient = (connectionType: ConnectionType): PrinterClient => {
  return new NiimbotPrinterClient(connectionType);
};

export type {
  PrinterCapabilities,
  PrinterClient,
  PrinterEventListener,
  PrinterEventMap,
  PrinterEventName,
  PrinterHeartbeatData,
  PrinterInfo,
  PrinterMetadata,
  PrinterPacket,
  PrinterPrintTask,
  PrinterRfidInfo,
} from "$/printers/types";
