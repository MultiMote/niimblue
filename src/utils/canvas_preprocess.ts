import * as fabric from "fabric";
import QRCode from "$/fabric-object/qrcode";
import Barcode from "$/fabric-object/barcode";
import dayjs from "dayjs";
import { CanvasUtils } from "$/utils/canvas_utils";

const VARIABLE_TEMPLATE_RX = /{\s*(\$?\w+)\s*(?:\|\s*(.*?)\s*)?}/g;

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
  canvas.forEachObject((obj: fabric.FabricObject) => {
    if (obj instanceof fabric.IText) {
      const text = preprocessString(obj.text ?? "", variables);

      if (obj instanceof fabric.Textbox && obj.fontAutoSize) {
        CanvasUtils.setAndShrinkTextboxText(obj, text, obj.width);
      } else {
        obj.set({ text });
      }
    } else if (obj instanceof QRCode) {
      obj.set({ text: preprocessString(obj.text ?? "", variables) });
    } else if (obj instanceof Barcode && obj.encoding === "CODE128B") {
      obj.set({ text: preprocessString(obj.text ?? "", variables) });
    }
  });
};
