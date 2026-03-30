import { Utils } from "@mmote/niimbluelib";

// copied from node_modules/qrcode-generator/dist/qrcode_UTF8.mjs (not sure how to import it from TS)
export const toUTF8Array = (str: string): number[] => {
  const utf8 = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    }
    // surrogate pair
    else {
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f),
      );
    }
  }
  return utf8;
};

export const stringToBytes = (str: string): number[] => {
  if (str.startsWith("hex:")) {
    const input = str.slice(4).replaceAll(" ", "").toLowerCase();
    
    if (input.length % 2 !== 0 || !/^[a-f0-9]+$/.test(input)) {
      throw new Error("Invalid hex input");
    }

    const buf = Utils.hexToBuf(input);
    return Array.from(buf);
  }

  return toUTF8Array(str);
};
