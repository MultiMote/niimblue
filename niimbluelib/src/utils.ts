export class Utils {
  public static numberToHex(n: number): string {
    const hex = n.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  }

  public static bufToHex(buf: DataView | Uint8Array | number[], separator: string = " "): string {
    const arr: number[] = buf instanceof DataView ? this.dataViewToNumberArray(buf) : Array.from(buf);
    return arr.map((n) => Utils.numberToHex(n)).join(separator);
  }

  public static hexToBuf(str: string): Uint8Array {
    const match = str.match(/[\da-f]{2}/gi);

    if (!match) {
      return new Uint8Array();
    }
    
    return new Uint8Array(
      match.map((h) => {
        return parseInt(h, 16);
      })
    );
  }

  public static dataViewToNumberArray(dw: DataView): number[] {
    const a: number[] = [];
    for (let i = 0; i < dw.byteLength; i++) {
      a.push(dw.getUint8(i));
    }
    return a;
  }

  public static dataViewToU8Array(dw: DataView): Uint8Array {
    return Uint8Array.from(this.dataViewToNumberArray(dw));
  }

  public static u8ArrayToString(arr: Uint8Array): string {
    return new TextDecoder().decode(arr);
  }

  /** Count non-zero bits in the byte array */
  public static countSetBits(arr: Uint8Array): number {
    // not so efficient, but readable
    let count: number = 0;

    arr.forEach((value) => {
      // shift until value becomes zero
      while (value > 0) {
        // check last bit
        if ((value & 1) === 1) {
          count++;
        }
        value >>= 1;
      }
    });

    return count;
  }

  /** Big endian  */
  public static u16ToBytes(n: number): [number, number] {
    const h = (n >> 8) & 0xff;
    const l = n % 256 & 0xff;
    return [h, l];
  }

  /** Big endian  */
  public static bytesToI16(arr: Uint8Array): number {
    Validators.u8ArrayLengthEquals(arr, 2);
    return arr[0] * 256 + arr[1];
  }

  public static u8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    return a.length === b.length && a.every((el, i) => el === b[i]);
  }

  public static sleep(ms: number): Promise<undefined> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public static isBluetoothSupported(): boolean {
    return typeof navigator.bluetooth?.requestDevice !== "undefined";
  }

  public static isSerialSupported(): boolean {
    return typeof navigator.serial?.requestPort !== "undefined";
  }
}

export class Validators {
  public static u8ArraysEqual(a: Uint8Array, b: Uint8Array, message?: string): void {
    if (!Utils.u8ArraysEqual(a, b)) {
      throw new Error(message ?? "Arrays must be equal");
    }
  }
  public static u8ArrayLengthEquals(a: Uint8Array, len: number, message?: string): void {
    if (a.length !== len) {
      throw new Error(message ?? `Array length must be ${len}`);
    }
  }
  public static u8ArrayLengthAtLeast(a: Uint8Array, len: number, message?: string): void {
    if (a.length < len) {
      throw new Error(message ?? `Array length must be at least ${len}`);
    }
  }
}
