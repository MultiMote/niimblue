import * as fabric from "fabric";
import { OBJECT_DEFAULTS_VECTOR } from "$/defaults";
import { ArUcoMarker } from "$/fabric-object/aruco";
import { Barcode, BARCODE_TEXT_MARGIN } from "$/fabric-object/barcode";
import { QRCode } from "$/fabric-object/qrcode";
import { packImageToGfa, rxToGbRounding } from "zpl-parser";

export type ZplExportResult = {
  zpl: string;
  warnings: string[];
};

type Orientation = "N" | "R" | "I" | "B";

type Emitter = (obj: fabric.FabricObject) => string[] | undefined;

const MIN_BAR_HEIGHT = 20;

const BARCODE_MODULE_RATIO = 3;

const QR_MAX_MAGNIFICATION = 10;

// model 2: model 1 is deprecated
const QR_MODEL = 2;

// The firmware draws ^BQ shifted down by the current ^BY height (which persists across
// print jobs), so the height must be pinned to 1 before every QR field.
const QR_BARCODE_HEIGHT_PIN = "^BY2,3,1";

// up to this multiple of the stroke thickness a line is a solid ^GB box, longer needs ^GD
const LINE_BOX_THICKNESS_FACTOR = 2;

const MIN_TEXT_FONT_SIZE = 8;

const DEFAULT_TEXT_FONT_SIZE = 20;

const round = (value: number): number => Math.max(0, Math.round(value));

const orientationFromAngle = (angle: number): Orientation => {
  const rotationQuadrant = 90;
  const rotationHalfQuadrant = rotationQuadrant / 2;
  const orientations: Orientation[] = ["N", "R", "I", "B"];

  const normalized = ((angle % 360) + 360) % 360;
  const index = Math.floor((normalized + rotationHalfQuadrant) / rotationQuadrant) % orientations.length;
  return orientations[index];
};

const fieldOrigin = (obj: fabric.FabricObject): { x: number; y: number } => {
  const point = obj.getPointByOrigin("left", "top");
  return { x: round(point.x), y: round(point.y) };
};

const emitZplFo = (obj: fabric.FabricObject): string => {
  const { x, y } = fieldOrigin(obj);
  return `^FO${round(x)},${round(y)}`;
};

const escapeFieldData = (text: string): { commands: string[]; data: string } => {
  const commands: string[] = [];
  let data = text.replace(/\r?\n/g, '\\&');
  // With ^FH_ active, '_' itself is the escape indicator, so it must be escaped too.
  if (/[\^~_]/.test(data)) {
    commands.push("^FH_");
    data = data.replace(/[\^~_]/g, (ch) => `_${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
  }

  return { commands, data };
};

const hasFill = (obj: fabric.FabricObject, fills: string[]): boolean => fills.includes(obj.fill as string);

const isFilledWhite = (obj: fabric.FabricObject): boolean => hasFill(obj, ["white", "#fff", "#ffffff"]);

const isSolidFill = (obj: fabric.FabricObject): boolean =>
  hasFill(obj, ["black", "#000", "#000000"]) || isFilledWhite(obj);

const zplColor = (obj: fabric.FabricObject): "B" | "W" => (isFilledWhite(obj) ? "W" : "B");

const strokeWidthOf = (obj: fabric.FabricObject): number =>
  Math.max(1, round(obj.strokeWidth ?? OBJECT_DEFAULTS_VECTOR.strokeWidth));

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

const emitQrcode: Emitter = (obj) => {
  if (!(obj instanceof QRCode)) {
    return undefined;
  }

  const moduleCount = obj.getModuleCount();
  if (moduleCount < 1) {
    return undefined;
  }

  const mag = Math.min(QR_MAX_MAGNIFICATION, Math.floor((obj.width * (obj.scaleX ?? 1)) / moduleCount));

  if (mag < 1) {
    return undefined;
  }

  const ori = orientationFromAngle(obj.angle ?? 0);
  const escaped = escapeFieldData(`${obj.ecl ?? "M"}A,${obj.text ?? ""}`);

  // ^BQ draws the square from ^FO, the editor centers it in the object box
  const size = mag * moduleCount;
  const xOffset = (obj.width * (obj.scaleX ?? 1) - size) / 2;
  const yOffset = (obj.height * (obj.scaleY ?? 1) - size) / 2;

  // the ^BY pin draws the symbol 1 dot off ^FO: +y for N, +x for B, nothing for R/I
  const origin = fieldOrigin(obj);
  let x: number, y: number;
  switch (ori) {
    case "N":
      x = origin.x + xOffset;
      y = origin.y + yOffset - 1;
      break;
    case "R":
      x = origin.x - yOffset - size + 1;
      y = origin.y + xOffset;
      break;
    case "I":
      x = origin.x - xOffset - size + 1;
      y = origin.y - yOffset - size + 1;
      break;
    case "B":
      x = origin.x + xOffset - 1;
      y = origin.y - xOffset - size + 1;
      break;
  }

  return [
    QR_BARCODE_HEIGHT_PIN,
    `^FO${round(x)},${round(y)}`,
    `^BQ${ori},${QR_MODEL},${mag}`,
    ...escaped.commands,
    `^FD${escaped.data}^FS`,
  ];
};

const emitBarcode: Emitter = (obj) => {
  if (!(obj instanceof Barcode)) {
    return undefined;
  }

  const barScale = obj.getBarScale();
  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;

  if (obj.getModuleCount() < 1 || barScale < 1) {
    return undefined;
  }

  const ori = orientationFromAngle(obj.angle ?? 0);
  const printText = obj.printText ? "Y" : "N";
  // match Barcode._render; getScaledHeight() adds an extra dot for the stroke width
  const caption = obj.printText ? (obj.fontSize + BARCODE_TEXT_MARGIN) * scaleY : 0;
  const barHeight = Math.max(MIN_BAR_HEIGHT, Math.round(obj.height * scaleY - caption));

  const escaped = escapeFieldData(obj.text ?? "");
  // m=A: the printer auto-picks subsets like the editor; mode N encodes digits as subset B
  const mode = obj.encoding === "CODE128" ? ",A" : "";
  const symbology =
    obj.encoding === "EAN13"
      ? `^BE${ori},${barHeight},${printText},N`
      : `^BC${ori},${barHeight},${printText},N,N${mode}`;

  // ZPL anchors the bars band at ^FO per orientation, while the editor draws it inside
  // the object box (after the EAN-13 leading digit) — shift ^FO accordingly
  const barsStart = obj.getBarsStart() * scaleX;
  const barsLength = obj.getModuleCount() * barScale * scaleX;
  const origin = fieldOrigin(obj);
  let x: number, y: number;
  switch (ori) {
    case "N":
      x = origin.x + barsStart;
      y = origin.y;
      break;
    case "R":
      x = origin.x - barHeight + 1;
      y = origin.y + barsStart;
      break;
    case "I":
      x = origin.x - barsStart - barsLength + 1;
      y = origin.y - barHeight + 1;
      break;
    case "B":
      x = origin.x;
      y = origin.y - barsStart - barsLength + 1;
      break;
  }

  return [
    `^BY${barScale},${BARCODE_MODULE_RATIO},${barHeight}`,
    `^FO${round(x)},${round(y)}`,
    symbology,
    ...escaped.commands,
    `^FD${escaped.data}^FS`,
  ];
};

const emitCircle: Emitter = (obj) => {
  if (!(obj instanceof fabric.Circle)) {
    return undefined;
  }

  const diameter = round(obj.getScaledWidth());
  const thickness = isSolidFill(obj) ? Math.round(diameter / 2) : strokeWidthOf(obj);
  return [emitZplFo(obj), `^GC${diameter},${thickness},${zplColor(obj)}^FS`];
};

const emitEllipse: Emitter = (obj) => {
  if (!(obj instanceof fabric.Ellipse)) {
    return undefined;
  }

  const width = Math.max(1, round(obj.getScaledWidth()));
  const height = Math.max(1, round(obj.getScaledHeight()));
  const thickness = isSolidFill(obj) ? Math.round(Math.min(width, height) / 2) : strokeWidthOf(obj);

  return [emitZplFo(obj), `^GE${width},${height},${thickness},${zplColor(obj)}^FS`];
};

const emitRect: Emitter = (obj) => {
  if (!(obj instanceof fabric.Rect)) {
    return undefined;
  }

  const ori = orientationFromAngle(obj.angle ?? 0);

  // Rotated rects have no ^GB equivalent; fall through to the raster path.
  if (ori !== "N") {
    return undefined;
  }

  const width = Math.max(1, round(obj.getScaledWidth()));
  const height = Math.max(1, round(obj.getScaledHeight()));
  const rx = (obj.rx ?? 0) * (obj.scaleX ?? 1);
  const rounding = rxToGbRounding(width, height, rx);
  const thickness = isSolidFill(obj) ? Math.min(width, height) : strokeWidthOf(obj);

  return [emitZplFo(obj), `^GB${width},${height},${thickness},${zplColor(obj)},${rounding}^FS`];
};

const diagonalOrientation = (obj: fabric.FabricObject): "L" | "R" => {
  if (obj instanceof fabric.Polyline && obj.points && obj.points.length >= 2) {
    const start = obj.points[0]!;
    const end = obj.points.at(-1)!;
    return (end.x - start.x) * (end.y - start.y) > 0 ? "R" : "L";
  }

  if (obj instanceof fabric.Line) {
    return ((obj.x2 ?? 0) - (obj.x1 ?? 0)) * ((obj.y2 ?? 0) - (obj.y1 ?? 0)) > 0 ? "R" : "L";
  }

  return "L";
};

const emitLine: Emitter = (obj) => {
  if (!(obj instanceof fabric.Line) && !(obj instanceof fabric.Polyline)) {
    return undefined;
  }

  const width = Math.max(1, round(obj.getScaledWidth()));
  const height = Math.max(1, round(obj.getScaledHeight()));
  const thickness = strokeWidthOf(obj);

  if (height <= thickness * LINE_BOX_THICKNESS_FACTOR) {
    return [emitZplFo(obj), `^GB${width},${thickness},${thickness},B,0^FS`];
  }

  if (width <= thickness * LINE_BOX_THICKNESS_FACTOR) {
    return [emitZplFo(obj), `^GB${thickness},${height},${thickness},B,0^FS`];
  }

  return [emitZplFo(obj), `^GD${width},${height},${thickness},B,${diagonalOrientation(obj)}^FS`];
};

const emitText: Emitter = (obj) => {
  if (!(obj instanceof fabric.IText) || obj.fontFamily === "Material Icons") {
    return undefined;
  }

  const ori = orientationFromAngle(obj.angle ?? 0);
  const fontSize = Math.max(MIN_TEXT_FONT_SIZE, round((obj.fontSize ?? DEFAULT_TEXT_FONT_SIZE) * (obj.scaleY ?? 1)));
  const escaped = escapeFieldData(obj.text ?? "");
  const block: string[] = [emitZplFo(obj), `^A0${ori},${fontSize},${fontSize}`];

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
