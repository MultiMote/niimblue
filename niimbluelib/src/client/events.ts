import { ConnectionInfo, PrinterInfo } from ".";
import { HeartbeatData, NiimbotPacket } from "../packets";

/**
 *
 */
export class ConnectEvent extends Event {
  info: ConnectionInfo;
  constructor(info: ConnectionInfo) {
    super("connect");
    this.info = info;
  }
}

/**
 *
 */
export class DisconnectEvent extends Event {
  constructor() {
    super("disconnect");
  }
} // add reason maybe?

/**
 *
 */
export class PacketReceivedEvent extends Event {
  packet: NiimbotPacket;
  constructor(packet: NiimbotPacket) {
    super("packetreceived");
    this.packet = packet;
  }
}

/**
 *
 */
export class PacketSentEvent extends Event {
  packet: NiimbotPacket;
  constructor(packet: NiimbotPacket) {
    super("packetsent");
    this.packet = packet;
  }
}

/**
 *
 */
export class RawPacketSentEvent extends Event {
  data: Uint8Array;
  constructor(data: Uint8Array) {
    super("rawpacketsent");
    this.data = data;
  }
}

/**
 *
 */
export class RawPacketReceivedEvent extends Event {
  data: Uint8Array;
  constructor(data: Uint8Array) {
    super("rawpacketreceived");
    this.data = data;
  }
}

/**
 *
 */
export class HeartbeatEvent extends Event {
  data: HeartbeatData;
  constructor(data: HeartbeatData) {
    super("heartbeat");
    this.data = data;
  }
}

/**
 *
 */
export class PrinterInfoFetchedEvent extends Event {
  info: PrinterInfo;
  constructor(info: PrinterInfo) {
    super("printerinfofetched");
    this.info = info;
  }
}

/**
 *
 */
export class PrintProgressEvent extends Event {
  /** 0 – n */
  page: number;

  pagesTotal: number;
  /** 0 – 100 */
  pagePrintProgress: number;
  /** 0 – 100 */
  pageFeedProgress: number;

  constructor(page: number, pagesTotal: number, pagePrintProgress: number, pageFeedProgress: number) {
    super("printprogress");
    this.page = page;
    this.pagesTotal = pagesTotal;
    this.pagePrintProgress = pagePrintProgress;
    this.pageFeedProgress = pageFeedProgress;
  }
}

export interface ClientEventMap {
  connect: ConnectEvent;
  disconnect: DisconnectEvent;
  rawpacketsent: RawPacketSentEvent;
  rawpacketreceived: RawPacketReceivedEvent;
  packetreceived: PacketReceivedEvent;
  packetsent: PacketSentEvent;
  heartbeat: HeartbeatEvent;
  printerinfofetched: PrinterInfoFetchedEvent;
  printprogress: PrintProgressEvent;
}
