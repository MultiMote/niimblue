import { Utils } from "..";

/** Utility class to sequentially fetch data from byte array. EOF checks included.  */
export class SequentialDataReader {
  private bytes: Uint8Array;
  private offset: number;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.offset = 0;
  }

  /** Check available bytes bytes and throw exception if EOF met */
  private willRead(count: number) {
    // console.log(`willRead ${count} (offset becomes ${this.offset+count} / ${this.bytes.length})`)
    if (this.offset + count > this.bytes.length) {
      throw new Error("Tried to read too much data");
    }
  }

  /** Skip bytes */
  skip(len: number): void {
    this.willRead(len);
    this.offset += len;
  }

  /** Read fixed length bytes */
  readBytes(len: number): Uint8Array {
    this.willRead(len);
    const part = this.bytes.slice(this.offset, this.offset + len);
    this.offset += len;
    return part;
  }

  /** Read variable length bytes */
  readVBytes(): Uint8Array {
    const len = this.readI8();
    const part: Uint8Array = this.readBytes(len);
    return part;
  }

  /** Read variable length string */
  readVString(): string {
    const part: Uint8Array = this.readVBytes();
    return Utils.u8ArrayToString(part);
  }

  /** Read 8 bit int (big endian) */
  readI8(): number {
    this.willRead(1);
    const result = this.bytes[this.offset];
    this.offset += 1;
    return result;
  }

  readBool(): boolean {
    return this.readI8() > 0;
  }

  /** Read 16 bit int (big endian) */
  readI16(): number {
    this.willRead(2);
    const part = this.bytes.slice(this.offset, this.offset + 2);
    this.offset += 2;
    return Utils.bytesToI16(part);
  }

  /** Check EOF condition */
  end() {
    if (this.offset != this.bytes.length) {
      throw new Error("Extra data left");
    }
  }
}
