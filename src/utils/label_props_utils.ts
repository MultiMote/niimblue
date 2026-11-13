import type { PrinterInfo, PrinterModelMeta } from "@mmote/niimbluelib";
import type { LabelProps, LabelUnit } from "$/types";

export class LabelPropsUtils {
  static getPrintheadSize(printerInfo?: PrinterInfo, printerMeta?: PrinterModelMeta): number {
    if (printerInfo?.printheadWidth !== undefined) {
      return printerInfo.printheadWidth;
    }
    return printerMeta?.printheadPixels ?? -1;
  }

  static unitToPx(value: number, unit: LabelUnit, dpmm: number): number {
    return Math.floor(value * (unit === "mm" ? dpmm : 1));
  }

  static sizeToPx(labelProps: LabelProps): { width: number; height: number } {
    const width = this.unitToPx(labelProps.width, labelProps.unit, labelProps.dpmm);
    const height = this.unitToPx(labelProps.height, labelProps.unit, labelProps.dpmm);

    return { width: Math.max(width, 1), height: Math.max(height, 1) };
  }

  static tailLengthToPx(labelProps: LabelProps): number {
    return this.unitToPx(labelProps.tailLength ?? 0, labelProps.unit, labelProps.dpmm);
  }
}
