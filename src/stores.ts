import { writable } from "svelte/store";
import type { ConnectionState, ConnectionType } from "./types";
import {
  ConnectEvent,
  HeartbeatEvent,
  NiimbotBluetoothClient,
  NiimbotSerialClient,
  PacketReceivedEvent,
  PacketSentEvent,
  PrinterInfoFetchedEvent,
  RequestCommandId,
  ResponseCommandId,
  Utils,
  type HeartbeatData,
  type NiimbotAbstractClient,
  type PrinterInfo,
  type PrinterModelMeta,
} from "@mmote/niimbluelib";

export const connectionState = writable<ConnectionState>("disconnected");
export const connectedPrinterName = writable<string>("");
export const printerClient = writable<NiimbotAbstractClient>();
export const heartbeatData = writable<HeartbeatData>();
export const printerInfo = writable<PrinterInfo>();
export const printerMeta = writable<PrinterModelMeta|undefined>();

export const initClient = (connectionType: ConnectionType) => {
  printerClient.update((prevClient: NiimbotAbstractClient) => {
    let newClient: NiimbotAbstractClient = prevClient;

    if (
      prevClient === undefined ||
      (connectionType !== "bluetooth" && prevClient instanceof NiimbotBluetoothClient) ||
      (connectionType !== "serial" && prevClient instanceof NiimbotSerialClient)
    ) {
      if (prevClient !== undefined) {
        prevClient.disconnect();
      }
      if (connectionType === "bluetooth") {
        console.log("new NiimbotBluetoothClient");
        newClient = new NiimbotBluetoothClient();
      } else {
        console.log("new NiimbotSerialClient");
        newClient = new NiimbotSerialClient();
      }

      // newClient.addEventListener("rawpacketsent", (e: RawPacketSentEvent) => {
      //   console.log(`>> ${Utils.bufToHex(e.data)}`);
      // });

      newClient.addEventListener("packetsent", (e: PacketSentEvent) => {
        console.log(`>> ${Utils.bufToHex(e.packet.toBytes())} (${RequestCommandId[e.packet.command]})`);
      });


      // newClient.addEventListener("rawpacketreceived", (e: RawPacketReceivedEvent) => {
      //   console.log(`<< ${Utils.bufToHex(e.data)}`);
      // });

      newClient.addEventListener("packetreceived", (e: PacketReceivedEvent) => {
        console.log(`<< ${Utils.bufToHex(e.packet.toBytes())} (${ResponseCommandId[e.packet.command]})`);
      });

      newClient.addEventListener("connect", (e: ConnectEvent) => {
        console.log("onConnect");
        connectionState.set("connected");
        connectedPrinterName.set(e.info.deviceName ?? "unknown");
      });

      newClient.addEventListener("printerinfofetched", (e: PrinterInfoFetchedEvent) => {
        console.log("printerInfoFetched");
        printerInfo.set(e.info);
        printerMeta.set(newClient.getModelMetadata());
      });

      newClient.addEventListener("disconnect", () => {
        console.log("onDisconnect");
        connectionState.set("disconnected");
        connectedPrinterName.set("");
        printerInfo.set({});
        printerMeta.set(undefined);
      });

      newClient.addEventListener("heartbeat", (e: HeartbeatEvent) => {
        heartbeatData.set(e.data);
      });
    }

    return newClient;
  });
};
