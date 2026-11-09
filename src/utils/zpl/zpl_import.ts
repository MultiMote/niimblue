import * as fabric from "fabric";
import { OBJECT_DEFAULTS, OBJECT_DEFAULTS_BARCODE, OBJECT_DEFAULTS_TEXT, OBJECT_DEFAULTS_VECTOR } from "$/defaults";
import { Barcode } from "$/fabric-object/barcode";
import { QRCode } from "$/fabric-object/qrcode";
import { TextboxExt } from "$/fabric-object/textbox-ext";
import { BARCODE_TEXT_MARGIN } from "$/fabric-object/barcode";
import { decodeGfaArgs, type RgbaImage, type ZplObjectSpec } from "zpl-parser";
import { barcodeModuleCount, qrModuleCount } from "$/utils/zpl/zpl_barcode";

export type { ZplFidelity, ZplObjectSpec, ZplParseResult, ZplTone } from "zpl-parser";
export { parseZpl } from "zpl-parser";

/** QR version 1 module count: the parser sizes ^BQ fields as mag×21. */
const QR_VERSION_1_MODULES = 21;

// fixed caption reserve zpl-parser adds to ^BC/^BE heights
const PARSER_BARCODE_CAPTION_RESERVE = 16;

let measureBarcodeContext: CanvasRenderingContext2D | undefined | null;

const measureBarcodeText = (text: string, fontSize: number): number => {
  measureBarcodeContext ??= document.createElement("canvas").getContext("2d");
  if (!measureBarcodeContext) {
    return Math.round(fontSize * 0.6);
  }
  measureBarcodeContext.font = `bold ${fontSize}px ${OBJECT_DEFAULTS_BARCODE.fontFamily}`;
  return measureBarcodeContext.measureText(text).width;
};

const rgbaToDataUrl = (rgba: RgbaImage): string => {
  const canvas = document.createElement("canvas");
  canvas.width = rgba.width;
  canvas.height = rgba.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create a 2D canvas context");
  }
  const imageData = ctx.createImageData(rgba.width, rgba.height);
  imageData.data.set(rgba.data);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
};

const vectorPaint = (spec: { filled: boolean; tone: string; strokeWidth: number }) => ({
  fill: spec.filled ? spec.tone : "transparent",
  stroke: spec.tone,
  strokeWidth: spec.filled ? 0 : spec.strokeWidth,
});

const buildZplObject = async (spec: ZplObjectSpec): Promise<fabric.FabricObject | undefined> => {
  switch (spec.kind) {
    case "text": {
      const props = {
        ...OBJECT_DEFAULTS_TEXT,
        left: spec.left,
        top: spec.top,
        fontSize: spec.fontSize,
        angle: spec.angle,
        originX: "left" as fabric.TOriginX,
        originY: spec.originY,
        textAlign: "left" as const,
      };
      return spec.width && spec.width > 0
        ? new TextboxExt(spec.text, { ...props, width: spec.width, fill: spec.fill })
        : new fabric.IText(spec.text, { ...props, fill: spec.fill });
    }

    case "rect":
      return new fabric.Rect({
        ...OBJECT_DEFAULTS_VECTOR,
        left: spec.left,
        top: spec.top,
        width: spec.width,
        height: spec.height,
        rx: spec.rx,
        ry: spec.rx,
        angle: spec.angle,
        ...vectorPaint(spec),
      });

    case "circle":
      return new fabric.Circle({
        ...OBJECT_DEFAULTS_VECTOR,
        left: spec.left,
        top: spec.top,
        radius: spec.radius,
        ...vectorPaint(spec),
      });

    case "ellipse":
      return new fabric.Ellipse({
        ...OBJECT_DEFAULTS_VECTOR,
        left: spec.left,
        top: spec.top,
        rx: spec.rx,
        ry: spec.ry,
        ...vectorPaint(spec),
      });

    case "line": {
      const points =
        spec.orientation === "L"
          ? [
              { x: 0, y: spec.height },
              { x: spec.width, y: 0 },
            ]
          : [
              { x: 0, y: 0 },
              { x: spec.width, y: spec.height },
            ];
      return new fabric.Polyline(points, {
        ...OBJECT_DEFAULTS_VECTOR,
        left: spec.left,
        top: spec.top,
        fill: "transparent",
        stroke: spec.tone,
        strokeWidth: spec.strokeWidth,
      });
    }

    case "graphic": {
      try {
        const rgba = await decodeGfaArgs(spec.args, spec.invert);
        if (!rgba) {
          return undefined;
        }
        const img = await fabric.FabricImage.fromURL(rgbaToDataUrl(rgba));
        img.set({
          ...OBJECT_DEFAULTS,
          left: spec.left,
          top: spec.top,
          originX: "left",
          originY: "top",
        });
        return img;
      } catch {
        return undefined;
      }
    }

    case "barcode": {
      const moduleWidth = Math.max(1, spec.scaleFactor);
      // EAN-13: the editor draws the leading digit in a box left of the bars,
      // ^BE prints the bars at ^FO and the digit outside, left of it
      const digitBoxWidth =
        spec.encoding === "EAN13"
          ? Math.ceil(measureBarcodeText(spec.text.charAt(0), OBJECT_DEFAULTS_BARCODE.fontSize))
          : 0;

      const barsWidth = Math.round(barcodeModuleCount(spec.encoding, spec.text) * moduleWidth);
      const barcodeWidth = barsWidth + digitBoxWidth;

      // replace the parser's caption reserve with the editor's (fontSize + margin)
      const barsHeight = Math.max(1, spec.height - (spec.printText ? PARSER_BARCODE_CAPTION_RESERVE : 0));
      const height = spec.printText ? barsHeight + OBJECT_DEFAULTS_BARCODE.fontSize + BARCODE_TEXT_MARGIN : barsHeight;

      // shift the object so the bars land where the source ZPL prints them
      // (inverse of the exporter's ^FO offsets)
      const angleOffset = ((spec.angle % 360) + 360) % 360;
      let left = spec.left;
      let top = spec.top;
      switch (angleOffset) {
        case 90:
          left = spec.left + barsHeight - 1;
          top = spec.top - digitBoxWidth;
          break;
        case 180:
          left = spec.left + barsWidth - 1 + digitBoxWidth;
          top = spec.top + barsHeight - 1;
          break;
        case 270:
          top = spec.top + barsWidth - 1 + digitBoxWidth;
          break;
        default:
          left = spec.left - digitBoxWidth;
      }

      return new Barcode({
        ...OBJECT_DEFAULTS,
        left,
        top,
        width: Math.max(1, barcodeWidth),
        height,
        encoding: spec.encoding,
        printText: spec.printText,
        angle: spec.angle,
        originX: "left",
        originY: "top",
        text: spec.text,
      });
    }

    case "qrcode": {
      const mag = Math.max(1, Math.floor(spec.size / QR_VERSION_1_MODULES));
      let size = spec.size;
      try {
        size = mag * qrModuleCount(spec.text, spec.ecl);
      } catch {
        // payload too large for the requested ECL: keep the parser-provided size
      }
      // keep the source magnification exactly (no fixFabricObjectScale qrMin inflation);
      // shift the object by the inverse of the exporter's ^FO offsets
      const angleOffset = ((spec.angle % 360) + 360) % 360;
      let left = spec.left;
      let top = spec.top;
      switch (angleOffset) {
        case 90:
          left = spec.left + size - 1;
          break;
        case 180:
          left = spec.left + size - 1;
          top = spec.top + size - 1;
          break;
        case 270:
          left = spec.left + 1;
          top = spec.top + size - 1;
          break;
        default:
          top = spec.top + 1;
      }
      return new QRCode({
        ...OBJECT_DEFAULTS,
        left,
        top,
        width: size,
        height: size,
        text: spec.text,
        ecl: spec.ecl,
        angle: spec.angle,
        originX: "left",
        originY: "top",
      });
    }
  }
};

export const addZplObjectsToCanvas = async (
  canvas: fabric.Canvas | fabric.StaticCanvas,
  specs: ZplObjectSpec[],
): Promise<fabric.FabricObject[]> => {
  const created: fabric.FabricObject[] = [];

  for (const spec of specs) {
    const obj = await buildZplObject(spec);
    if (obj) {
      canvas.add(obj);
      created.push(obj);
    }
  }

  canvas.requestRenderAll();
  return created;
};
