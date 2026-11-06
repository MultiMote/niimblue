import * as fabric from "fabric";
import { OBJECT_DEFAULTS, OBJECT_DEFAULTS_TEXT, OBJECT_DEFAULTS_VECTOR } from "$/defaults";
import { Barcode } from "$/fabric-object/barcode";
import { QRCode } from "$/fabric-object/qrcode";
import { TextboxExt } from "$/fabric-object/textbox-ext";
import { CanvasUtils } from "$/utils/canvas_utils";
import { decodeGfaArgs, type RgbaImage, type ZplObjectSpec } from "zpl-parser";
import { barcodeModuleCount, ean13MarginWidth, qrModuleCount } from "$/utils/zpl/zpl_barcode";

export type { ZplFidelity, ZplObjectSpec, ZplParseResult, ZplTone } from "zpl-parser";
export { parseZpl } from "zpl-parser";

/** Dev Barcode's default font size; EAN-13 digit margin is derived from it. */
const BARCODE_DEFAULT_FONT_SIZE = 12;

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

/** Paint properties for closed vector shapes: solid tone fill or a tone outline. */
const vectorPaint = (spec: { filled: boolean; tone: string; strokeWidth: number }) => ({
  fill: spec.filled ? spec.tone : "transparent",
  stroke: spec.tone,
  strokeWidth: spec.filled ? 0 : spec.strokeWidth,
});

/**
 * Build a Fabric object for a parsed ZPL spec.
 * Returns undefined when the spec should be skipped (e.g. an undecodable graphic).
 */
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
      // Undecodable graphics are skipped instead of aborting the whole import.
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
      // Dev Barcode derives the bar width from its intrinsic width, so size the
      // object so that the resulting module width matches the ZPL ^BY value.
      const moduleWidth = Math.max(1, spec.scaleFactor);
      const barcodeWidth =
        Math.round(barcodeModuleCount(spec.encoding, spec.text) * moduleWidth) +
        (spec.encoding === "EAN13" ? ean13MarginWidth(BARCODE_DEFAULT_FONT_SIZE) : 0);
      return new Barcode({
        ...OBJECT_DEFAULTS,
        left: spec.left,
        top: spec.top,
        width: Math.max(1, barcodeWidth),
        height: spec.height,
        encoding: spec.encoding,
        printText: spec.printText,
        angle: spec.angle,
        originX: "left",
        originY: "top",
        text: spec.text,
      });
    }

    case "qrcode": {
      // The parser sizes the symbol as mag×21 assuming QR version 1; recover the magnification
      // and re-size by the real module count so the object matches what a printer will render.
      const mag = Math.max(1, Math.floor(spec.size / 21));
      let size = spec.size;
      try {
        size = mag * qrModuleCount(spec.text, spec.ecl);
      } catch {
        // keep the parser's size when the data cannot be encoded
      }
      const obj = new QRCode({
        ...OBJECT_DEFAULTS,
        left: spec.left,
        top: spec.top,
        width: size,
        height: size,
        text: spec.text,
        ecl: spec.ecl,
        angle: spec.angle,
        originX: "left",
        originY: "top",
      });
      // Same integer-size normalize as JSON load / resize.
      CanvasUtils.fixFabricObjectScale(obj);
      return obj;
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
