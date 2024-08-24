import { Validators } from "../utils";
import { RequestCommandId, ResponseCommandId } from ".";

export class NiimbotPacket {
  public static readonly HEAD = new Uint8Array([0x55, 0x55]);
  public static readonly TAIL = new Uint8Array([0xaa, 0xaa]);

  private _command: RequestCommandId | ResponseCommandId;
  private _data: Uint8Array;
  private _validResponseIds: ResponseCommandId[];

  /** There can be no response after this request. */
  private _oneWay: boolean;

  constructor(
    command: RequestCommandId | ResponseCommandId,
    data: Uint8Array | number[],
    validResponseIds: ResponseCommandId[] = []
  ) {
    this._command = command;
    this._data = data instanceof Uint8Array ? data : new Uint8Array(data);
    this._validResponseIds = validResponseIds;
    this._oneWay = false;
  }

  /** Data length (header, command, dataLen, checksum, tail are excluded). */
  public get dataLength(): number {
    return this._data.length;
  }
  public get length(): number {
    return (
      NiimbotPacket.HEAD.length + // head
      1 + // cmd
      1 + // dataLength
      this.dataLength +
      1 + // checksum
      NiimbotPacket.TAIL.length
    );
  }

  public set oneWay(value: boolean) {
    this._oneWay = value;
  }

  public get oneWay(): boolean {
    return this._oneWay;
  }

  public get validResponseIds(): ResponseCommandId[] {
    return this._validResponseIds;
  }

  public get command(): RequestCommandId | ResponseCommandId {
    return this._command;
  }

  public get data(): Uint8Array {
    return this._data;
  }

  public get checksum(): number {
    let checksum = 0;
    checksum ^= this._command;
    checksum ^= this._data.length;
    this._data.forEach((i: number) => (checksum ^= i));
    return checksum;
  }

  // [0x55, 0x55, CMD, DATA_LEN, DA =//= TA, CHECKSUM, 0xAA, 0xAA]
  public toBytes(): Uint8Array {
    const buf = new ArrayBuffer(
      NiimbotPacket.HEAD.length + // head
        1 + // cmd
        1 + // dataLength
        this._data.length +
        1 + // checksum
        NiimbotPacket.TAIL.length
    );

    const arr = new Uint8Array(buf);

    let pos = 0;

    arr.set(NiimbotPacket.HEAD, pos);
    pos += NiimbotPacket.HEAD.length;

    arr[pos] = this._command;
    pos += 1;

    arr[pos] = this._data.length;
    pos += 1;

    arr.set(this._data, pos);
    pos += this._data.length;

    arr[pos] = this.checksum;
    pos += 1;

    arr.set(NiimbotPacket.TAIL, pos);

    if (this._command === RequestCommandId.Connect) {
      // const newArr = new Uint8Array(arr.length + 1);
      // newArr[0] = 3;
      // newArr.set(arr, 1);
      return new Uint8Array([3, ...arr]);
    }

    return arr;
  }

  public static fromBytes(buf: Uint8Array): NiimbotPacket {
    const head = new Uint8Array(buf.slice(0, 2));
    const tail = new Uint8Array(buf.slice(buf.length - 2));
    const minPacketSize =
      NiimbotPacket.HEAD.length + // head
      1 + // cmd
      1 + // dataLength
      1 + // checksum
      NiimbotPacket.TAIL.length;

    if (buf.length < minPacketSize) {
      throw new Error(`Packet is too small (${buf.length} < ${minPacketSize})`);
    }

    Validators.u8ArraysEqual(head, NiimbotPacket.HEAD, "Invalid packet head");

    Validators.u8ArraysEqual(tail, NiimbotPacket.TAIL, "Invalid packet tail");

    const cmd: number = buf[2];
    const dataLen: number = buf[3];

    if (buf.length !== minPacketSize + dataLen) {
      throw new Error(`Invalid packet size (${buf.length} < ${minPacketSize + dataLen})`);
    }

    const data: Uint8Array = new Uint8Array(buf.slice(4, 4 + dataLen));
    const checksum: number = buf[4 + dataLen];
    const packet = new NiimbotPacket(cmd, data);

    if (packet.checksum !== checksum) {
      throw new Error("Invalid packet checksum");
    }

    return packet;
  }

  /** Parse data containing one or more packets */
  public static fromBytesMultiPacket(buf: Uint8Array): NiimbotPacket[] {
    const chunks: Uint8Array[] = [];

    let head1pos = -1;
    let head2pos = -1;
    let tail1pos = -1;
    let tail2pos = -1;

    // split data to chunks by head and tail bytes
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i];
      if (v === NiimbotPacket.HEAD[0]) {
        if (head1pos === -1) {
          head1pos = i;
          head2pos = -1;
        } else {
          head2pos = i;
        }
      } else if (v === NiimbotPacket.TAIL[0]) {
        if (head1pos !== -1 && head2pos !== -1) {
          if (tail1pos === -1) {
            tail1pos = i;
            tail2pos = -1;
          } else {
            tail2pos = i;
          }
        }
      }

      if (head1pos !== -1 && head2pos !== -1 && tail1pos !== -1 && tail2pos !== -1) {
        chunks.push(buf.slice(head1pos, tail2pos + 1));
        head1pos = -1;
        head2pos = -1;
        tail1pos = -1;
        tail2pos = -1;
      }
    }

    const chunksDataLen: number = chunks.reduce((acc: number, b: Uint8Array) => acc + b.length, 0);

    if (buf.length !== chunksDataLen) {
      throw new Error("Splitted chunks data length not equals buffer length");
    }

    return chunks.map((c) => this.fromBytes(c));
  }
}
