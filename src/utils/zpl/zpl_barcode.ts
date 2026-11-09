import JsBarcode from "jsbarcode";
import QRCodeFactory from "qrcode-generator";

interface JsBarcodeResult {
  encodings?: { data: string }[];
}

export const barcodeModuleCount = (encoding: string, text: string): number => {
  const result: JsBarcodeResult = {};
  try {
    JsBarcode(result, text, {
      format: encoding,
      width: 1,
      height: 1,
      displayValue: false,
      margin: 0,
    });
  } catch {
    return 0;
  }
  return (result.encodings ?? []).filter((e) => e.data.includes("1")).reduce((sum, e) => sum + e.data.length, 0);
};

export const qrModuleCount = (text: string, ecl: ErrorCorrectionLevel): number => {
  const qr = QRCodeFactory(0, ecl);
  qr.addData(text, "Byte");
  qr.make();
  return qr.getModuleCount();
};
