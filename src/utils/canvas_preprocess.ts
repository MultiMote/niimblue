import { fabric } from "fabric";
import QRCode from "../fabric-object/qrcode.class";
import Barcode from "../fabric-object/barcode.class";
import dayjs from "dayjs";

const VARIABLE_TEMPLATE_RX = /{\s*(\w+)\s*(?:\|\s*(.*?)\s*)?}/g;

const preprocessDateTime = (format?: string) => {
  const dt = dayjs();
  if (format) {
    return dt.format(format);
  }
  return dt.format("YYYY-MM-DD HH:mm:ss");
};

const preprocessString = (input: string, variables?: { [v: string]: string }): string => {
  return input.replace(VARIABLE_TEMPLATE_RX, (src, key, filter) => {
    if (variables !== undefined && key in variables) {
      return variables[key];
    } else if (key === "dt") {
      return preprocessDateTime(filter);
    }
    return src;
  });
};

/** Replace text templates in some canvas objects */
export const canvasPreprocess = (canvas: fabric.Canvas, variables?: { [key: string]: string }) => {
  canvas.forEachObject((obj: fabric.Object) => {
    if (obj instanceof fabric.IText) {
      obj.set({ text: preprocessString(obj.text ?? "", variables) });
    } else if (obj instanceof QRCode) {
      obj.set({ text: preprocessString(obj.text ?? "", variables) });
    } else if (obj instanceof Barcode && obj.encoding === "CODE128B") {
      obj.set({ text: preprocessString(obj.text ?? "", variables) });
    }
  });
};
