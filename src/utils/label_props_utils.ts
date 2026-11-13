import type { LabelProps, LabelUnit } from "$/types";

export class LabelPropsUtils {
  static unitToPx(value: number, unit: LabelUnit, dpmm: number): number {
    return Math.floor(value * (unit === "mm" ? dpmm : 1));
  }

  static sizeToPx(labelProps: LabelProps): { width: number; height: number } {
    let width = this.unitToPx(labelProps.width, labelProps.unit, labelProps.dpmm);
    let height = this.unitToPx(labelProps.height, labelProps.unit, labelProps.dpmm);

    // printable dimension must be a multiple of 8
    if (labelProps.printDirection === "left") {
      height -= height % 8;
    } else {
      width -= width % 8;
    }

    return { width: Math.max(width, 8), height: Math.max(height, 8) };
  }

  static tailLengthToPx(labelProps: LabelProps): number {
    return this.unitToPx(labelProps.tailLength ?? 0, labelProps.unit, labelProps.dpmm);
  }
}
