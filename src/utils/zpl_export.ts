import * as fabric from "fabric";
import { ArUcoMarker } from "$/fabric-object/aruco";
import { Barcode } from "$/fabric-object/barcode";
import { QRCode } from "$/fabric-object/qrcode";
import { packImageToGfa, rxToGbRounding } from "zpl-parser";

export type ZplExportResult = {
  zpl: string;
  warnings: string[];
};

type Orientation = "N" | "R" | "I" | "B";

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

const escapeFieldData = (text: string): { commands: string[]; data: string } => {
  const commands: string[] = [];
  let data = text.replace(/\r\n/g, "\n").replace(/\n/g, "\\&");
  if (/[\^~]/.test(data)) {
    commands.push("^FH_");
    data = data.replace(/[\^~]/g, (ch) => `_${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
  }
  return { commands, data };
};

const isFilledBlack = (obj: fabric.FabricObject): boolean => {
  const fill = obj.fill;
  return fill === "black" || fill === "#000" || fill === "#000000";
};

const isFilledWhite = (obj: fabric.FabricObject): boolean => {
  const fill = obj.fill;
  return fill === "white" || fill === "#fff" || fill === "#ffffff";
};

const zplColor = (obj: fabric.FabricObject): "B" | "W" => (isFilledWhite(obj) ? "W" : "B");

const isWhiteFill = (value: unknown): boolean =>
  value === "white" || value === "#fff" || value === "#ffffff";

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

const emitFo = (obj: fabric.FabricObject): string => {
  const { x, y } = fieldOrigin(obj);
  return `^FO${x},${y}`;
};

export const canvasToZpl = (canvas: fabric.Canvas): ZplExportResult => {
  const warnings: string[] = [];
  const lines: string[] = [
    "^XA",
    "^CI28",
    `^PW${round(canvas.getWidth())}`,
    `^LL${round(canvas.getHeight())}`,
  ];

  const objects = canvas.getObjects().filter((obj) => obj.visible !== false);

  for (const obj of objects) {
    if (obj instanceof QRCode) {
      const ori = orientationFromAngle(obj.angle ?? 0);
      const mag = Math.min(10, Math.max(1, Math.round(obj.getScaledWidth() / 21)));
      const ecl = obj.ecl ?? "M";
      const escaped = escapeFieldData(`${ecl}A,${obj.text ?? ""}`);
      lines.push(emitFo(obj), `^BQ${ori},2,${mag}`, ...escaped.commands, `^FD${escaped.data}^FS`);
      continue;
    }

    if (obj instanceof Barcode) {
      const ori = orientationFromAngle(obj.angle ?? 0);
      const printText = obj.printText ? "Y" : "N";
      const barHeight = Math.max(20, round(obj.getScaledHeight() - (obj.printText ? obj.fontSize * 1.2 : 0)));
      const escaped = escapeFieldData(obj.text ?? "");
      lines.push(`^BY${Math.max(1, round(obj.scaleFactor ?? 1))},3,${barHeight}`);
      if (obj.encoding === "EAN13") {
        lines.push(emitFo(obj), `^BE${ori},${barHeight},${printText},N`, ...escaped.commands, `^FD${escaped.data}^FS`);
      } else {
        lines.push(emitFo(obj), `^BC${ori},${barHeight},${printText},N,N`, ...escaped.commands, `^FD${escaped.data}^FS`);
      }
      continue;
    }

    if (obj instanceof fabric.Circle) {
      const diameter = round(obj.getScaledWidth());
      const thickness = isFilledBlack(obj) || isFilledWhite(obj) ? Math.round(diameter / 2) : Math.max(1, round(obj.strokeWidth ?? 3));
      lines.push(emitFo(obj), `^GC${diameter},${thickness},${zplColor(obj)}^FS`);
      continue;
    }

    if (obj instanceof fabric.Ellipse) {
      const width = Math.max(1, round(obj.getScaledWidth()));
      const height = Math.max(1, round(obj.getScaledHeight()));
      const thickness =
        isFilledBlack(obj) || isFilledWhite(obj)
          ? Math.round(Math.min(width, height) / 2)
          : Math.max(1, round(obj.strokeWidth ?? 3));
      lines.push(emitFo(obj), `^GE${width},${height},${thickness},${zplColor(obj)}^FS`);
      continue;
    }

    if (obj instanceof fabric.Rect) {
      const width = Math.max(1, round(obj.getScaledWidth()));
      const height = Math.max(1, round(obj.getScaledHeight()));
      const rx = (obj.rx ?? 0) * (obj.scaleX ?? 1);
      const rounding = rxToGbRounding(width, height, rx);
      const thickness = isFilledBlack(obj) || isFilledWhite(obj) ? Math.min(width, height) : Math.max(1, round(obj.strokeWidth ?? 3));
      const ori = orientationFromAngle(obj.angle ?? 0);
      if (ori === "N") {
        lines.push(emitFo(obj), `^GB${width},${height},${thickness},${zplColor(obj)},${rounding}^FS`);
        continue;
      }
    }

    if (obj instanceof fabric.Line || obj instanceof fabric.Polyline) {
      const width = Math.max(1, round(obj.getScaledWidth()));
      const height = Math.max(1, round(obj.getScaledHeight()));
      const thickness = Math.max(1, round(obj.strokeWidth ?? 3));
      if (height <= thickness * 2) {
        lines.push(emitFo(obj), `^GB${width},${thickness},${thickness},B,0^FS`);
      } else if (width <= thickness * 2) {
        lines.push(emitFo(obj), `^GB${thickness},${height},${thickness},B,0^FS`);
      } else {
        let orientation: "L" | "R" = "L";
        if (obj instanceof fabric.Polyline && obj.points && obj.points.length >= 2) {
          const start = obj.points[0]!;
          const end = obj.points[obj.points.length - 1]!;
          orientation = (end.x - start.x) * (end.y - start.y) > 0 ? "R" : "L";
        } else if (obj instanceof fabric.Line) {
          orientation = ((obj.x2 ?? 0) - (obj.x1 ?? 0)) * ((obj.y2 ?? 0) - (obj.y1 ?? 0)) > 0 ? "R" : "L";
        }
        lines.push(emitFo(obj), `^GD${width},${height},${thickness},B,${orientation}^FS`);
      }
      continue;
    }

    if (obj instanceof fabric.IText && obj.fontFamily !== "Material Icons") {
      const ori = orientationFromAngle(obj.angle ?? 0);
      const fontSize = Math.max(8, round((obj.fontSize ?? 20) * (obj.scaleY ?? 1)));
      const escaped = escapeFieldData(obj.text ?? "");
      const block: string[] = [emitFo(obj), `^A0${ori},${fontSize},${fontSize}`];
      if (isWhiteFill(obj.fill)) {
        block.push("^FR");
      }
      if (obj instanceof fabric.Textbox && obj.width > 0) {
        const linesCount = Math.max(1, (obj.text ?? "").split("\n").length);
        block.push(`^FB${round(obj.getScaledWidth())},${linesCount},0,L,0`);
      }
      block.push(...escaped.commands, `^FD${escaped.data}^FS`);
      lines.push(...block);
      continue;
    }

    const gfa = rasterizeObject(obj);
    if (gfa) {
      const bound = obj.getBoundingRect();
      lines.push(`^FO${round(bound.left)},${round(bound.top)}`, `${gfa}^FS`);
      if (obj instanceof fabric.FabricImage) {
        warnings.push("Images are exported as 1-bit graphics and will not stay as separate photos.");
      } else if (obj instanceof ArUcoMarker) {
        warnings.push("ArUco markers are exported as graphics.");
      } else if (obj instanceof fabric.IText) {
        warnings.push("Icon text is exported as a graphic.");
      } else {
        warnings.push(`Unsupported object (${obj.type}) exported as a graphic.`);
      }
      continue;
    }

    warnings.push(`Skipped object of type "${obj.type}".`);
  }

  lines.push("^XZ");
  return { zpl: lines.join("\n") + "\n", warnings: [...new Set(warnings)] };
};
