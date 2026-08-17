import * as fabric from "fabric";
import { OBJECT_DEFAULTS, OBJECT_DEFAULTS_TEXT, OBJECT_DEFAULTS_VECTOR } from "$/defaults";
import { Barcode } from "$/fabric-object/barcode";
import { QRCode } from "$/fabric-object/qrcode";
import { TextboxExt } from "$/fabric-object/textbox-ext";
import { CanvasUtils } from "$/utils/canvas_utils";
import { decodeGfaArgs, type RgbaImage, type ZplObjectSpec } from "zpl-parser";

export type { ZplFidelity, ZplObjectSpec, ZplParseResult, ZplTone } from "zpl-parser";
export { parseZpl } from "zpl-parser";

const rgbaToDataUrl = (rgba: RgbaImage): string => {
  const canvas = document.createElement("canvas");
  canvas.width = rgba.width;
  canvas.height = rgba.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a 2D canvas context");
  const imageData = ctx.createImageData(rgba.width, rgba.height);
  imageData.data.set(rgba.data);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
};

export const addZplObjectsToCanvas = async (
  canvas: fabric.Canvas | fabric.StaticCanvas,
  specs: ZplObjectSpec[],
): Promise<fabric.FabricObject[]> => {
  const created: fabric.FabricObject[] = [];

  for (const spec of specs) {
    if (spec.kind === "text") {
      const textProps = {
        ...OBJECT_DEFAULTS_TEXT,
        left: spec.left,
        top: spec.top,
        fontSize: spec.fontSize,
        angle: spec.angle,
        originX: "left" as fabric.TOriginX,
        originY: spec.originY,
        textAlign: "left" as const,
      };

      const obj =
        spec.width && spec.width > 0
          ? new TextboxExt(spec.text, { ...textProps, width: spec.width, fill: spec.fill })
          : new fabric.IText(spec.text, { ...textProps, fill: spec.fill });
      canvas.add(obj);
      created.push(obj);
      continue;
    }

    if (spec.kind === "rect") {
      const obj = new fabric.Rect({
        ...OBJECT_DEFAULTS_VECTOR,
        left: spec.left,
        top: spec.top,
        width: spec.width,
        height: spec.height,
        rx: spec.rx,
        ry: spec.rx,
        angle: spec.angle,
        fill: spec.filled ? spec.tone : "transparent",
        stroke: spec.tone,
        strokeWidth: spec.filled ? 0 : spec.strokeWidth,
      });
      canvas.add(obj);
      created.push(obj);
      continue;
    }

    if (spec.kind === "circle") {
      const obj = new fabric.Circle({
        ...OBJECT_DEFAULTS_VECTOR,
        left: spec.left,
        top: spec.top,
        radius: spec.radius,
        fill: spec.filled ? spec.tone : "transparent",
        stroke: spec.tone,
        strokeWidth: spec.filled ? 0 : spec.strokeWidth,
      });
      canvas.add(obj);
      created.push(obj);
      continue;
    }

    if (spec.kind === "ellipse") {
      const obj = new fabric.Ellipse({
        ...OBJECT_DEFAULTS_VECTOR,
        left: spec.left,
        top: spec.top,
        rx: spec.rx,
        ry: spec.ry,
        fill: spec.filled ? spec.tone : "transparent",
        stroke: spec.tone,
        strokeWidth: spec.filled ? 0 : spec.strokeWidth,
      });
      canvas.add(obj);
      created.push(obj);
      continue;
    }

    if (spec.kind === "line") {
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
      const obj = new fabric.Polyline(points, {
        ...OBJECT_DEFAULTS_VECTOR,
        left: spec.left,
        top: spec.top,
        fill: "transparent",
        stroke: spec.tone,
        strokeWidth: spec.strokeWidth,
      });
      canvas.add(obj);
      created.push(obj);
      continue;
    }

    if (spec.kind === "graphic") {
      try {
        const rgba = await decodeGfaArgs(spec.args, spec.invert);
        if (!rgba) continue;
        const img = await fabric.FabricImage.fromURL(rgbaToDataUrl(rgba));
        img.set({
          ...OBJECT_DEFAULTS,
          left: spec.left,
          top: spec.top,
          originX: "left",
          originY: "top",
        });
        canvas.add(img);
        created.push(img);
      } catch {
        continue;
      }
      continue;
    }

    if (spec.kind === "barcode") {
      const obj = new Barcode({
        ...OBJECT_DEFAULTS,
        left: spec.left,
        top: spec.top,
        height: spec.height,
        encoding: spec.encoding,
        printText: spec.printText,
        scaleFactor: spec.scaleFactor,
        angle: spec.angle,
        originX: "left",
        originY: "top",
        text: spec.text,
      });
      canvas.add(obj);
      created.push(obj);
      continue;
    }

    const obj = new QRCode({
      ...OBJECT_DEFAULTS,
      left: spec.left,
      top: spec.top,
      width: spec.size,
      height: spec.size,
      text: spec.text,
      ecl: spec.ecl,
      angle: spec.angle,
      originX: "left",
      originY: "top",
    });
    // ZPL size is mag×21 (often odd); same even-size normalize as JSON load / resize.
    CanvasUtils.fixFabricObjectScale(obj);
    canvas.add(obj);
    created.push(obj);
  }

  canvas.requestRenderAll();
  return created;
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, encoded] = dataUrl.split(",", 2);
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(encoded ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

export const renderZplToPngBlob = async (
  specs: ZplObjectSpec[],
  width: number,
  height: number,
): Promise<Blob | undefined> => {
  const el = document.createElement("canvas");
  el.width = width;
  el.height = height;
  const temp = new fabric.StaticCanvas(el, {
    width,
    height,
    backgroundColor: "white",
    renderOnAddRemove: false,
  });

  try {
    await addZplObjectsToCanvas(temp, specs);
    temp.renderAll();
    const dataUrl = temp.toDataURL({ format: "png", multiplier: 1 });
    return dataUrlToBlob(dataUrl);
  } finally {
    temp.dispose();
  }
};
