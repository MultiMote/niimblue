import { PrintTaskVersion } from ".";
import { PrinterModel as M } from "..";

export const getPrintTaskVersion = (model: M): PrintTaskVersion | undefined => {
  switch (model) {
    case M.D11:
    case M.D11_H:
    case M.D11S:
      return PrintTaskVersion.V1;
    case M.D110:
    case M.D110_M:
      return PrintTaskVersion.V3;
    case M.B1:
      return PrintTaskVersion.V4;
  }

  return undefined;
};
