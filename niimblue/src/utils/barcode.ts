type EAN13BitPattern = {
  A: string;
  B: string;
  C: string;
};
const ean13_bp: Record<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9", EAN13BitPattern> = {
  "0": { A: "0001101", B: "0100111", C: "1110010" },
  "1": { A: "0011001", B: "0110011", C: "1100110" },
  "2": { A: "0010011", B: "0011011", C: "1101100" },
  "3": { A: "0111101", B: "0100001", C: "1000010" },
  "4": { A: "0100011", B: "0011101", C: "1011100" },
  "5": { A: "0110001", B: "0111001", C: "1001110" },
  "6": { A: "0101111", B: "0000101", C: "1010000" },
  "7": { A: "0111011", B: "0010001", C: "1000100" },
  "8": { A: "0110111", B: "0001001", C: "1001000" },
  "9": { A: "0001011", B: "0010111", C: "1110100" },
};
const ean13_table_switch_mask = {
  "0": "AAAAAA",
  "1": "AABABB",
  "2": "AABBAB",
  "3": "AABBBA",
  "4": "ABAABB",
  "5": "ABBAAB",
  "6": "ABBBAA",
  "7": "ABABAB",
  "8": "ABABBA",
  "9": "ABBABA",
};

/**
 * Convert 12 or 13 digit numbers to EAN13 barcode
 * @param data string of 12 or 13 digits
 * @returns string of EAN13 barcode, it is an array of 95 characters, each character is either 0 or 1, representing a white or black stripe, respectively.
 */
export function ean13(data: string) {
  if (data.length > 13) throw new Error("Data too long for EAN13");
  if (data.length < 12) data = data.padEnd(12, "0");
  if (/^\d+$/.test(data) === false) throw new Error("Invalid character in EAN13");

  // checksum
  let checksum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(data[i], 10);
    checksum += (i % 2 === 0 ? 1 : 3) * digit;
  }
  checksum = (10 - (checksum % 10)) % 10;
  if (data.length === 12) data += checksum.toString();
  else if (data.length === 13 && data[12] !== checksum.toString()) throw new Error("Invalid checksum in EAN13");

  const result: string[] = [];

  result.push("101"); // Start
  // Left Side
  const table_switch = ean13_table_switch_mask[data[0] as keyof typeof ean13_table_switch_mask];
  for (let i = 1; i < 7; i++) {
    const digit = data[i];
    const tab = table_switch[i - 1] as keyof EAN13BitPattern;
    const coding = ean13_bp[digit as keyof typeof ean13_bp][tab];
    result.push(coding);
  }
  result.push("01010"); // Center Guard
  // Right Side
  for (let i = 7; i < 13; i++) {
    const digit = data[i];
    const coding = ean13_bp[digit as keyof typeof ean13_bp].C;
    result.push(coding);
  }
  result.push("101"); // Stop

  return {
    text: data,
    bandcode: result.join(""),
  };
}

// --------------------------------

type Code128BitPattern = {
  ascii: number;
  code: string;
};
const code128_bp: Code128BitPattern[] = [
  { ascii: 32, code: "11011001100" }, // A: SP, B: SP, C: 00, BandCode: 212222
  { ascii: 33, code: "11001101100" }, // A: !, B: !, C: 01, BandCode: 222122
  { ascii: 34, code: "11001100110" }, // A: “, B: “, C: 02, BandCode: 222221
  { ascii: 35, code: "10010011000" }, // A: #, B: #, C: 03, BandCode: 121223
  { ascii: 36, code: "100h0001100" }, // A: $, B: $, C: 04, BandCode: 121322
  { ascii: 37, code: "10001001100" }, // A: %, B: %, C: 05, BandCode: 131222
  { ascii: 38, code: "10011001000" }, // A: &, B: &, C: 06, BandCode: 122213
  { ascii: 39, code: "10011000100" }, // A: ‘, B: ‘, C: 07, BandCode: 122312
  { ascii: 40, code: "10001100100" }, // A: (, B: (, C: 08, BandCode: 132212
  { ascii: 41, code: "1100h00h000" }, // A: ), B: ), C: 09, BandCode: 221213
  { ascii: 42, code: "11001000100" }, // A: *, B: *, C: 10, BandCode: 221312
  { ascii: 43, code: "11000100100" }, // A: +, B: +, C: 11, BandCode: 231212
  { ascii: 44, code: "10110011100" }, // A: ,, B: ,, C: 12, BandCode: 112232
  { ascii: 45, code: "10011011100" }, // A: -, B: -, C: 13, BandCode: 122132
  { ascii: 46, code: "10011001110" }, // A: ., B: ., C: 14, BandCode: 122231
  { ascii: 47, code: "10111001100" }, // A: /, B: /, C: 15, BandCode: 113222
  { ascii: 48, code: "10011101100" }, // A: 0, B: 0, C: 16, BandCode: 123122
  { ascii: 49, code: "10011100110" }, // A: 1, B: 1, C: 17, BandCode: 123221
  { ascii: 50, code: "11001110010" }, // A: 2, B: 2, C: 18, BandCode: 223211
  { ascii: 51, code: "11001011100" }, // A: 3, B: 3, C: 19, BandCode: 221132
  { ascii: 52, code: "11001001110" }, // A: 4, B: 4, C: 20, BandCode: 221231
  { ascii: 53, code: "11011100100" }, // A: 5, B: 5, C: 21, BandCode: 213212
  { ascii: 54, code: "11001110100" }, // A: 6, B: 6, C: 22, BandCode: 223112
  { ascii: 55, code: "11101101110" }, // A: 7, B: 7, C: 23, BandCode: 312131
  { ascii: 56, code: "11101001100" }, // A: 8, B: 8, C: 24, BandCode: 311222
  { ascii: 57, code: "11100101100" }, // A: 9, B: 9, C: 25, BandCode: 321122
  { ascii: 58, code: "11100100110" }, // A: :, B: :, C: 26, BandCode: 321221
  { ascii: 59, code: "11101100100" }, // A: ;, B: ;, C: 27, BandCode: 312212
  { ascii: 60, code: "11100110100" }, // A: <, B: <, C: 28, BandCode: 322112
  { ascii: 61, code: "11100110010" }, // A: =, B: =, C: 29, BandCode: 322211
  { ascii: 62, code: "11011011000" }, // A: >, B: >, C: 30, BandCode: 212123
  { ascii: 63, code: "11011000110" }, // A: ?, B: ?, C: 31, BandCode: 212321
  { ascii: 64, code: "11000110110" }, // A: @, B: @, C: 32, BandCode: 232121
  { ascii: 65, code: "10100011000" }, // A: A, B: A, C: 33, BandCode: 111323
  { ascii: 66, code: "10001011000" }, // A: B, B: B, C: 34, BandCode: 131123
  { ascii: 67, code: "10001000110" }, // A: C, B: C, C: 35, BandCode: 131321
  { ascii: 68, code: "10110001000" }, // A: D, B: D, C: 36, BandCode: 112313
  { ascii: 69, code: "10001101000" }, // A: E, B: E, C: 37, BandCode: 132113
  { ascii: 70, code: "10001100010" }, // A: F, B: F, C: 38, BandCode: 132311
  { ascii: 71, code: "11010001000" }, // A: G, B: G, C: 39, BandCode: 211313
  { ascii: 72, code: "11000101000" }, // A: H, B: H, C: 40, BandCode: 231113
  { ascii: 73, code: "11000100010" }, // A: I, B: I, C: 41, BandCode: 231311
  { ascii: 74, code: "10110111000" }, // A: J, B: J, C: 42, BandCode: 112133
  { ascii: 75, code: "10110001110" }, // A: K, B: K, C: 43, BandCode: 112331
  { ascii: 76, code: "10001101110" }, // A: L, B: L, C: 44, BandCode: 132131
  { ascii: 77, code: "10111011000" }, // A: M, B: M, C: 45, BandCode: 113123
  { ascii: 78, code: "10111000110" }, // A: N, B: N, C: 46, BandCode: 113321
  { ascii: 79, code: "10001110110" }, // A: O, B: O, C: 47, BandCode: 133121
  { ascii: 80, code: "11101110110" }, // A: P, B: P, C: 48, BandCode: 313121
  { ascii: 81, code: "11010001110" }, // A: Q, B: Q, C: 49, BandCode: 211331
  { ascii: 82, code: "11000101110" }, // A: R, B: R, C: 50, BandCode: 231131
  { ascii: 83, code: "11011101000" }, // A: S, B: S, C: 51, BandCode: 213113
  { ascii: 84, code: "11011100010" }, // A: T, B: T, C: 52, BandCode: 213311
  { ascii: 85, code: "11011101110" }, // A: U, B: U, C: 53, BandCode: 213131
  { ascii: 86, code: "11101011000" }, // A: V, B: V, C: 54, BandCode: 311123
  { ascii: 87, code: "11101000110" }, // A: W, B: W, C: 55, BandCode: 311321
  { ascii: 88, code: "11100010110" }, // A: X, B: X, C: 56, BandCode: 331121
  { ascii: 89, code: "11101101000" }, // A: Y, B: Y, C: 57, BandCode: 312113
  { ascii: 90, code: "11101100010" }, // A: Z, B: Z, C: 58, BandCode: 312311
  { ascii: 91, code: "11100011010" }, // A: [, B: [, C: 59, BandCode: 332111
  { ascii: 92, code: "11101111010" }, // A: \, B: \, C: 60, BandCode: 314111
  { ascii: 93, code: "11001000010" }, // A: ], B: ], C: 61, BandCode: 221411
  { ascii: 94, code: "11110001010" }, // A: ^, B: ^, C: 62, BandCode: 431111
  { ascii: 95, code: "10100110000" }, // A: _, B: _, C: 63, BandCode: 111224
  { ascii: 96, code: "10100001100" }, // A: NUL, B: `, C: 64, BandCode: 111422
  { ascii: 97, code: "10010110000" }, // A: SOH, B: a, C: 65, BandCode: 121124
  { ascii: 98, code: "10010000110" }, // A: STX, B: b, C: 66, BandCode: 121421
  { ascii: 99, code: "10000101100" }, // A: ETX, B: c, C: 67, BandCode: 141122
  { ascii: 100, code: "10000100110" }, // A: EOT, B: d, C: 68, BandCode: 141221
  { ascii: 101, code: "10110010000" }, // A: ENQ, B: e, C: 69, BandCode: 112214
  { ascii: 102, code: "10110000100" }, // A: ACK, B: f, C: 70, BandCode: 112412
  { ascii: 103, code: "10011010000" }, // A: BEL, B: g, C: 71, BandCode: 122114
  { ascii: 104, code: "10011000010" }, // A: BS, B: h, C: 72, BandCode: 122411
  { ascii: 105, code: "10000110100" }, // A: HT, B: i, C: 73, BandCode: 142112
  { ascii: 106, code: "10000110010" }, // A: LF, B: j, C: 74, BandCode: 142211
  { ascii: 107, code: "11000010010" }, // A: VT, B: k, C: 75, BandCode: 241211
  { ascii: 108, code: "11001010000" }, // A: FF, B: l, C: 76, BandCode: 221114
  { ascii: 109, code: "11110111010" }, // A: CR, B: m, C: 77, BandCode: 413111
  { ascii: 110, code: "11000010100" }, // A: SO, B: n, C: 78, BandCode: 241112
  { ascii: 111, code: "10001111010" }, // A: SI, B: o, C: 79, BandCode: 134111
  { ascii: 112, code: "10100111100" }, // A: DLE, B: p, C: 80, BandCode: 111242
  { ascii: 113, code: "10010111100" }, // A: DC1, B: q, C: 81, BandCode: 121142
  { ascii: 114, code: "10010011110" }, // A: DC2, B: r, C: 82, BandCode: 121241
  { ascii: 115, code: "10111100100" }, // A: DC3, B: s, C: 83, BandCode: 114212
  { ascii: 116, code: "10011110100" }, // A: DC4, B: t, C: 84, BandCode: 124112
  { ascii: 117, code: "10011110010" }, // A: NAK, B: u, C: 85, BandCode: 124211
  { ascii: 118, code: "11110100100" }, // A: SYN, B: v, C: 86, BandCode: 411212
  { ascii: 119, code: "11110010100" }, // A: ETB, B: w, C: 87, BandCode: 421112
  { ascii: 120, code: "11110010010" }, // A: CAN, B: x, C: 88, BandCode: 421211
  { ascii: 121, code: "11011011110" }, // A: EM, B: y, C: 89, BandCode: 212141
  { ascii: 122, code: "11011110110" }, // A: SUB, B: z, C: 90, BandCode: 214121
  { ascii: 123, code: "11110110110" }, // A: ESC, B: {, C: 91, BandCode: 412121
  { ascii: 124, code: "10101111000" }, // A: FS, B: |, C: 92, BandCode: 111143
  { ascii: 125, code: "10100011110" }, // A: GS, B: }, C: 93, BandCode: 111341
  { ascii: 126, code: "10001011110" }, // A: RS, B: ~, C: 94, BandCode: 131141
  { ascii: 200, code: "10111101000" }, // A: US, B: DEL, C: 95, BandCode: 114113
  { ascii: 201, code: "10111100010" }, // A: FNC3, B: FNC3, C: 96, BandCode: 114311
  { ascii: 202, code: "11110101000" }, // A: FNC2, B: FNC2, C: 97, BandCode: 411113
  { ascii: 203, code: "11110100010" }, // A: SHIFT, B: SHIFT, C: 98, BandCode: 411311
  { ascii: 204, code: "10111011110" }, // A: CODEC, B: CODEC, C: 99, BandCode: 113141
  { ascii: 205, code: "10111101110" }, // A: CODEB, B: FNC4, C: CODEB, BandCode: 114131
  { ascii: 206, code: "11101011110" }, // A: FNC4, B: CODEA, C: CODEA, BandCode: 311141
  { ascii: 207, code: "11110101110" }, // A: FNCl, B: FNCl, C: FNCl, BandCode: 411131
  { ascii: 208, code: "11010000100" }, // A: StartA, B: StartA, C: StartA, BandCode: 211412
  { ascii: 209, code: "11010010000" }, // A: StartB, B: StartB, C: StartB, BandCode: 211214
  { ascii: 210, code: "11010011100" }, // A: StartC, B: StartC, C: StartC, BandCode: 211232
  { ascii: 211, code: "1100011101011" }, // A: Stop, B: Stop, C: Stop, BandCode: 2331112
];
const code128_ascii_to_id = code128_bp.reduce((acc, { ascii }, idx) => {
  acc[ascii] = idx;
  return acc;
}, {} as Record<number, number>);

/**
 * Converts a string to Code128B barcode
 * @param data string to convert
 * @returns string of Code128B barcode, it is a sequence of 0 and 1, representing a white or black stripe, respectively.
 */
export function code128b(data: string) {
  // Code128 allows only 232 characters, but we need to add start, stop, and checksum, so there are 229 characters left.
  if (data.length > 229) throw new Error("Data too long for Code128B");

  const result: string[] = [];

  result.push(code128_bp[104].code); // Start Code B
  // Convert each character to Code128B
  let checksum = 104;
  for (let i = 0; i < data.length; i++) {
    const id = code128_ascii_to_id[data.charCodeAt(i)];
    if (id === undefined) throw new Error("Invalid character in Code128B");
    result.push(code128_bp[id].code);
    checksum += (i + 1) * id;
  }
  result.push(code128_bp[checksum % 103].code); // Checksum
  result.push(code128_bp[106].code); // Stop

  return result.join("");
}
