import * as fabric from "fabric";
import dayjs, { ManipulateType } from "dayjs";
import Barcode from "$/fabric-object/barcode";
import QRCode from "$/fabric-object/qrcode";
import { TextboxExt } from "$/fabric-object/textbox-ext";

const VARIABLE_TEMPLATE_RX = /{\s*(\$?\w+)(?:([+-])(\d+)([yMwdhms]))?\s*(?:\|\s*(.*?)\s*)?}/g;

type Variables = Record<string, string>;

const DATE_DURATION_UNITS: Record<string, ManipulateType> = {
  y: "year",
  M: "month",
  w: "week",
  d: "day",
  h: "hour",
  m: "minute",
  s: "second",
};

const preprocessDateTime = (format?: string, sign?: string, amount?: string, unit?: string): string => {
  let date = dayjs();

  if (sign && amount && unit) {
    const durationUnit = DATE_DURATION_UNITS[unit];

    if (durationUnit) {
      const value = Number(amount) * (sign === "-" ? -1 : 1);
      date = date.add(value, durationUnit);
    }
  }

  return date.format(format ?? "YYYY-MM-DD HH:mm:ss");
};

const preprocessString = (input: string, variables?: Variables): string => {
  return input.replace(
    VARIABLE_TEMPLATE_RX,
    (source, key: string, sign?: string, amount?: string, unit?: string, format?: string) => {
      if (variables !== undefined && key in variables) {
        return variables[key];
      }

      if (key === "dt") {
        return preprocessDateTime(format, sign, amount, unit);
      }

      return source;
    },
  );
};

/** Replace text templates in some canvas objects. */
export const canvasPreprocess = (canvas: fabric.Canvas, variables?: Variables): void => {
  canvas.forEachObject((obj: fabric.FabricObject) => {
    if (obj instanceof fabric.IText) {
      const text = preprocessString(obj.text ?? "", variables);

      if (obj instanceof TextboxExt && obj.fontAutoSize) {
        obj.setAndShrinkText(text, obj.width);
      } else {
        obj.set({ text });
      }

      return;
    }

    if (obj instanceof QRCode || obj instanceof Barcode) {
      obj.set({
        text: preprocessString(obj.text ?? "", variables),
      });
    }
  });
};
