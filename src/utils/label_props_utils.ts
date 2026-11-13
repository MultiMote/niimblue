import { ResolutionClass, type PrinterInfo, type PrinterModelMeta } from "@mmote/niimbluelib";
import type { LabelProps, LabelUnit, StandardDpi } from "$/types";

export class LabelPropsUtils {
  static getPrintheadSize(printerInfo?: PrinterInfo, printerMeta?: PrinterModelMeta): number {
    if (printerInfo?.printheadWidth !== undefined) {
      return printerInfo.printheadWidth;
    }
    return printerMeta?.printheadPixels ?? -1;
  }

  static getDpi(printerInfo?: PrinterInfo, printerMeta?: PrinterModelMeta): StandardDpi {
    if (printerInfo?.resolutionClass !== undefined) {
      return printerInfo.resolutionClass === ResolutionClass.DPI300 ? 300 : 203;
    }

    if (printerInfo?.capabilities?.printheadDpi !== undefined) {
      return printerInfo.capabilities.printheadDpi === 300 ? 300 : 203;
    }

    return printerMeta?.dpi === 300 ? 300 : 203;
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
