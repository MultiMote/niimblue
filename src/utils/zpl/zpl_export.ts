import * as fabric from "fabric";
import { ArUcoMarker } from "$/fabric-object/aruco";
import { Barcode } from "$/fabric-object/barcode";
import { QRCode } from "$/fabric-object/qrcode";
import { barcodeModuleCount, ean13MarginWidth } from "$/utils/zpl/zpl_barcode";
import { packImageToGfa, rxToGbRounding } from "zpl-parser";

export type ZplExportResult = {
  zpl: string;
  warnings: string[];
};

type Orientation = "N" | "R" | "I" | "B";

/** Emit ZPL commands for an object; undefined means there is no direct equivalent. */
type Emitter = (obj: fabric.FabricObject) => string[] | undefined;

const round = (value: number): number => Math.max(0, Math.round(value));

const orientationFromAngle = (angle: number): Orientation => {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized >= 315 || normalized < 45) return "N";
  if (normalized < 135) return "R";
  if (normalized < 225) return "I";
  return "B";
};

const fieldOrigin = (obj: fabric.FabricObject): { x: number; y: number } => {
  const point = obj.getPointByOrigin("left", "top");
  return { x: round(point.x), y: round(point.y) };
};

const emitFo = (obj: fabric.FabricObject, xOffset: number = 0): string => {
  const { x, y } = fieldOrigin(obj);
  return `^FO${round(x + xOffset)},${y}`;
};

const escapeFieldData = (text: string): { commands: string[]; data: string } => {
  const commands: string[] = [];
  let data = text.replace(/\r\n/g, "\n").replace(/\n/g, "\\&");
  // With ^FH_ active, '_' itself is the escape indicator, so it must be escaped too.
  if (/[\^~_]/.test(data)) {
    commands.push("^FH_");
    data = data.replace(/[\^~_]/g, (ch) => `_${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
  }
  return { commands, data };
};

const isFilledWhite = (obj: fabric.FabricObject): boolean => {
  const fill = obj.fill;
  return fill === "white" || fill === "#fff" || fill === "#ffffff";
};

const isSolidFill = (obj: fabric.FabricObject): boolean => {
  const fill = obj.fill;
  return fill === "black" || fill === "#000" || fill === "#000000" || isFilledWhite(obj);
};

/** ZPL tone parameter for an object fill: white-filled objects print in reverse. */
const zplColor = (obj: fabric.FabricObject): "B" | "W" => (isFilledWhite(obj) ? "W" : "B");

/** Effective stroke width, clamped to the smallest printable thickness. */
const strokeWidthOf = (obj: fabric.FabricObject): number => Math.max(1, round(obj.strokeWidth ?? 3));

const rasterizeObject = (obj: fabric.FabricObject): string | undefined => {
  try {
    const el = obj.toCanvasElement({ multiplier: 1 });
    const ctx = el.getContext("2d");
    if (!ctx) return undefined;
    return packImageToGfa(ctx.getImageData(0, 0, el.width, el.height));
  } catch {
    return undefined;
  }
};

/**
 * ZPL module width (^BY) for a barcode. The editor draws the bars with integer-size
 * modules (see Barcode._render), so prefer the geometry cached from the last render and
 * only approximate it from the object width before the first render.
 */
const barcodeModuleWidthPx = (obj: Barcode): number => {
  const cached = obj.getBarScale();
  if (cached >= 1) {
    return cached;
  }
  const text = obj.text ?? "";
  const modules = barcodeModuleCount(obj.encoding ?? "CODE128B", text);
  const scaleX = obj.scaleX ?? 1;
  // EAN-13 reserves space for the digits outside the guard bars (see Barcode._render).
  const margin =
    obj.encoding === "EAN13"
      ? Math.min(ean13MarginWidth((obj.fontSize ?? 12) * scaleX), obj.getScaledWidth() * 0.4)
      : 0;
  return Math.max(1, Math.floor((obj.getScaledWidth() - margin) / modules));
};

const emitQrcode: Emitter = (obj) => {
  if (!(obj instanceof QRCode)) return undefined;
  const moduleCount = obj.getModuleCount();
  const mag = Math.floor(obj.getScaledWidth() / moduleCount);
  if (!(mag >= 1)) {
    return undefined;
  }
  const ori = orientationFromAngle(obj.angle ?? 0);
  const escaped = escapeFieldData(`${obj.ecl ?? "M"}A,${obj.text ?? ""}`);
  // The firmware draws the QR symbol with its top edge shifted down by the current ^BY
  // barcode height — a format default that even survives across print jobs. Pin the
  // height to the minimum so the symbol lands exactly at the ^FO position.
  return [`^BY2,3,1`, emitFo(obj), `^BQ${ori},2,${Math.min(10, mag)}`, ...escaped.commands, `^FD${escaped.data}^FS`];
};

const emitBarcode: Emitter = (obj) => {
  if (!(obj instanceof Barcode)) return undefined;
  const ori = orientationFromAngle(obj.angle ?? 0);
  const printText = obj.printText ? "Y" : "N";
  const barHeight = Math.max(20, round(obj.getScaledHeight() - (obj.printText ? obj.fontSize * 1.2 : 0)));
  const escaped = escapeFieldData(obj.text ?? "");
  const symbology =
    obj.encoding === "EAN13" ? `^BE${ori},${barHeight},${printText},N` : `^BC${ori},${barHeight},${printText},N,N`;
  // The editor centers the barcode group inside the object (see Barcode._render), while
  // ^BC/^BE start their bars right at ^FO — shift the origin to the rendered bar start.
  const barsOffset = ori === "N" ? obj.getBarsStart() : 0;
  return [
    `^BY${barcodeModuleWidthPx(obj)},3,${barHeight}`,
    emitFo(obj, barsOffset),
    symbology,
    ...escaped.commands,
    `^FD${escaped.data}^FS`,
  ];
};

const emitCircle: Emitter = (obj) => {
  if (!(obj instanceof fabric.Circle)) return undefined;
  const diameter = round(obj.getScaledWidth());
  const thickness = isSolidFill(obj) ? Math.round(diameter / 2) : strokeWidthOf(obj);
  return [emitFo(obj), `^GC${diameter},${thickness},${zplColor(obj)}^FS`];
};

const emitEllipse: Emitter = (obj) => {
  if (!(obj instanceof fabric.Ellipse)) return undefined;
  const width = Math.max(1, round(obj.getScaledWidth()));
  const height = Math.max(1, round(obj.getScaledHeight()));
  const thickness = isSolidFill(obj) ? Math.round(Math.min(width, height) / 2) : strokeWidthOf(obj);
  return [emitFo(obj), `^GE${width},${height},${thickness},${zplColor(obj)}^FS`];
};

const emitRect: Emitter = (obj) => {
  if (!(obj instanceof fabric.Rect)) return undefined;
  const ori = orientationFromAngle(obj.angle ?? 0);
  // Rotated rects have no ^GB equivalent; fall through to the raster path.
  if (ori !== "N") return undefined;
  const width = Math.max(1, round(obj.getScaledWidth()));
  const height = Math.max(1, round(obj.getScaledHeight()));
  const rx = (obj.rx ?? 0) * (obj.scaleX ?? 1);
  const rounding = rxToGbRounding(width, height, rx);
  const thickness = isSolidFill(obj) ? Math.min(width, height) : strokeWidthOf(obj);
  return [emitFo(obj), `^GB${width},${height},${thickness},${zplColor(obj)},${rounding}^FS`];
};

/** ZPL diagonal direction inferred from the line endpoints. */
const diagonalOrientation = (obj: fabric.FabricObject): "L" | "R" => {
  if (obj instanceof fabric.Polyline && obj.points && obj.points.length >= 2) {
    const start = obj.points[0]!;
    const end = obj.points[obj.points.length - 1]!;
    return (end.x - start.x) * (end.y - start.y) > 0 ? "R" : "L";
  }
  if (obj instanceof fabric.Line) {
    return ((obj.x2 ?? 0) - (obj.x1 ?? 0)) * ((obj.y2 ?? 0) - (obj.y1 ?? 0)) > 0 ? "R" : "L";
  }
  return "L";
};

const emitLine: Emitter = (obj) => {
  if (!(obj instanceof fabric.Line) && !(obj instanceof fabric.Polyline)) return undefined;
  const width = Math.max(1, round(obj.getScaledWidth()));
  const height = Math.max(1, round(obj.getScaledHeight()));
  const thickness = strokeWidthOf(obj);
  if (height <= thickness * 2) {
    return [emitFo(obj), `^GB${width},${thickness},${thickness},B,0^FS`];
  }
  if (width <= thickness * 2) {
    return [emitFo(obj), `^GB${thickness},${height},${thickness},B,0^FS`];
  }
  return [emitFo(obj), `^GD${width},${height},${thickness},B,${diagonalOrientation(obj)}^FS`];
};

const emitText: Emitter = (obj) => {
  if (!(obj instanceof fabric.IText) || obj.fontFamily === "Material Icons") return undefined;
  const ori = orientationFromAngle(obj.angle ?? 0);
  const fontSize = Math.max(8, round((obj.fontSize ?? 20) * (obj.scaleY ?? 1)));
  const escaped = escapeFieldData(obj.text ?? "");
  const block: string[] = [emitFo(obj), `^A0${ori},${fontSize},${fontSize}`];
  if (isFilledWhite(obj)) {
    block.push("^FR");
  }
  if (obj instanceof fabric.Textbox && obj.width > 0) {
    const linesCount = Math.max(1, (obj.text ?? "").split("\n").length);
    block.push(`^FB${round(obj.getScaledWidth())},${linesCount},0,L,0`);
  }
  block.push(...escaped.commands, `^FD${escaped.data}^FS`);
  return block;
};

/** Direct ZPL emitters, tried in order; the first one matching the object type wins. */
const EMITTERS: Emitter[] = [emitQrcode, emitBarcode, emitCircle, emitEllipse, emitRect, emitLine, emitText];

const emitObject = (obj: fabric.FabricObject): string[] | undefined => {
  for (const emit of EMITTERS) {
    const commands = emit(obj);
    if (commands) {
      return commands;
    }
  }
  return undefined;
};

/** Explanation for an object that could only be exported as a raster graphic. */
const rasterWarning = (obj: fabric.FabricObject): string => {
  if (obj instanceof fabric.FabricImage) {
    return "Images are exported as 1-bit graphics and will not stay as separate photos.";
  }
  if (obj instanceof ArUcoMarker) {
    return "ArUco markers are exported as graphics.";
  }
  if (obj instanceof fabric.IText) {
    return "Icon text is exported as a graphic.";
  }
  return `Unsupported object (${obj.type}) exported as a graphic.`;
};

export const canvasToZpl = (canvas: fabric.Canvas): ZplExportResult => {
  const warnings: string[] = [];
  const lines: string[] = ["^XA", "^CI28", `^PW${round(canvas.getWidth())}`, `^LL${round(canvas.getHeight())}`];

  for (const obj of canvas.getObjects().filter((obj) => obj.visible !== false)) {
    const commands = emitObject(obj);
    if (commands) {
      lines.push(...commands);
      continue;
    }

    // No direct ZPL equivalent: rasterize the object into a ^GF graphic.
    const gfa = rasterizeObject(obj);
    if (gfa) {
      const bound = obj.getBoundingRect();
      lines.push(`^FO${round(bound.left)},${round(bound.top)}`, `${gfa}^FS`);
      warnings.push(rasterWarning(obj));
    } else {
      warnings.push(`Skipped object of type "${obj.type}".`);
    }
  }

  lines.push("^XZ");
  return { zpl: lines.join("\n") + "\n", warnings: [...new Set(warnings)] };
};
