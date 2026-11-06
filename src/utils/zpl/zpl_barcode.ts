import QRCodeFactory from "qrcode-generator";

export const qrModuleCount = (text: string, ecl: ErrorCorrectionLevel): number => {
  const qr = QRCodeFactory(0, ecl);
  qr.addData(text, "Byte");
  qr.make();
  return qr.getModuleCount();
};

export const barcodeModuleCount = (encoding: string, text: string): number => {
  if (encoding === "EAN13") {
    return 95;
  }
  return 11 * text.length + 35;
};

/** Approximate width reserved by EAN-13 for the digits outside the guard bars. */
export const ean13MarginWidth = (fontSize: number): number => {
  return Math.max(0, Math.round(1.2 * fontSize));
};
