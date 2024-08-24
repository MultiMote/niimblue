import { ProtocolVersion } from ".";
import { PrinterModel as M } from "..";

export const getPrintTaskVersion = (model: M): ProtocolVersion | undefined => {
  switch (model) {
    case M.D11:
    case M.D11_H:
    case M.D11S:
      return ProtocolVersion.V1;
    case M.D110:
    case M.D110_M:
      return ProtocolVersion.V3;
    case M.B1:
      return ProtocolVersion.V4;
  }

  return undefined;
};
