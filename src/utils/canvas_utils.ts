import * as fabric from "fabric";
import Barcode from "../fabric-object/barcode";
import QRCode from "../fabric-object/qrcode";

export function equalSpacingFillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  printWidth: number
) {
  // calculate every character width, and spacing
  const widths = [];
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const metrics = ctx.measureText(char);
    widths.push(metrics.width);
  }
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  const spacing = (printWidth - totalWidth) / (text.length - 1);

  // print every character with calculated spacing
  let offset = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    ctx.fillText(char, x + offset, y);
    offset += widths[i] + spacing;
  }
}

export function fixFabricObjectScale(obj: fabric.FabricObject) {
  const isNotScalable = obj instanceof Barcode || obj instanceof fabric.Rect || obj instanceof QRCode;

  if (isNotScalable) {
    obj.set({
      width: Math.round(obj.width * (obj.scaleX ?? 1)),
      height: Math.round(obj.height * (obj.scaleY ?? 1)),
      scaleX: 1,
      scaleY: 1,
      left: Math.round(obj.left),
      top: Math.round(obj.top),
    });

    // todo: move to QRCode maybe
    if (obj instanceof QRCode) {
      const qrMin = 42;
      const size = Math.max(obj.width + (obj.width % 2), qrMin);
      obj.set({
        width: size,
        height: size,
      });
    }
  }
}
