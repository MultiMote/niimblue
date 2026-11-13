import * as fabric from "fabric";
import type { AppConfig, LabelProps } from "$/types";
import { TextboxExt } from "$/fabric-object/textbox-ext";
import Barcode from "$/fabric-object/barcode";
import QRCode from "$/fabric-object/qrcode";

export const configureFabric = () => {
  fabric.config.disableStyleCopyPaste = true;

  fabric.classRegistry.setClass(TextboxExt, "Textbox");

  // Redraw objects on every step of a resize drag. By default Fabric keeps the old cached picture until
  // the mouse is released: scaled vector shapes (circle, SVG) look pixelated, and rect/QR/ArUco lose
  // the newly added part when enlarged.
  fabric.FabricObject.ownDefaults.noScaleCache = false;

  fabric.Line.prototype.setControlsVisibility({
    tl: false,
    bl: false,
    tr: false,
    br: false,
    mt: false,
    mb: false,
  });

  fabric.Polyline.prototype.setControlsVisibility({
    tl: false,
    bl: false,
    tr: false,
    br: false,
    mt: false,
    mb: false,
  });
};

/** Standard printhead densities, dots per mm */
export const DPI_DPMM: Record<203 | 300, number> = {
  203: 8,
  300: 11.81,
};

/** Default presets for LabelPropsEditor */
export const DEFAULT_LABEL_PRESETS: LabelProps[] = [
  // 203dpi
  { width: 40, height: 12, unit: "mm", dpmm: DPI_DPMM[203], printDirection: "left", shape: "rect" },
  { width: 48, height: 30, unit: "mm", dpmm: DPI_DPMM[203], printDirection: "top", shape: "rect" },
  // 300dpi
  {
    width: 40,
    height: 12,
    unit: "mm",
    dpmm: DPI_DPMM[300],
    printDirection: "left",
    shape: "rect",
    title: "40x12mm 300dpi",
  },
  {
    width: 48,
    height: 30,
    unit: "mm",
    dpmm: DPI_DPMM[300],
    printDirection: "top",
    shape: "rect",
    title: "48x30mm 300dpi",
  },
];

export const DEFAULT_LABEL_PROPS: LabelProps = {
  width: 30,
  height: 12,
  unit: "mm",
  dpmm: DPI_DPMM[203],
  printDirection: "left",
  shape: "rect",
};

/** Object movement snapping */
export const GRID_SIZE: number = 5;

export const BARCODE_WIDTH: number = 200;

/** Newly created Fabric object dimensions */
export const OBJECT_SIZE_DEFAULTS = {
  width: 64,
  height: 64,
};

/** Newly created Fabric object common properties */
export const OBJECT_DEFAULTS = {
  snapAngle: 10,
  top: 10,
  left: 10,
  originX: "left" as fabric.TOriginX,
  originY: "top" as fabric.TOriginY,
} as fabric.FabricObjectProps;

/** Newly created Fabric vector object properties */
export const OBJECT_DEFAULTS_VECTOR = {
  ...OBJECT_DEFAULTS,
  fill: "transparent",
  stroke: "black",
  strokeWidth: 3,
  strokeUniform: true,
} as fabric.FabricObjectProps;

/** Newly created Fabric text object properties */
export const OBJECT_DEFAULTS_TEXT = {
  ...OBJECT_DEFAULTS,
  fill: "black",
  fontFamily: "Noto Sans Variable",
  textAlign: "center" as fabric.TextboxProps["textAlign"],
  originX: "center" as fabric.TOriginX,
  originY: "center" as fabric.TOriginY,
  lineHeight: 1,
} as fabric.TextboxProps;

export const OBJECT_DEFAULTS_BARCODE = {
  text: "123456789012",
  encoding: "CODE128B",
  printText: true,
  fontSize: 12,
  fontFamily: OBJECT_DEFAULTS_TEXT.fontFamily,
  width: BARCODE_WIDTH,
  height: OBJECT_SIZE_DEFAULTS.height,
} as fabric.TClassProperties<Barcode>;

export const OBJECT_DEFAULTS_QRCODE: Partial<fabric.TClassProperties<QRCode>> = {
  text: "NiimBlue",
  ecl: "M",
  stroke: "#000000",
  fill: "#ffffff",
  mode: "Byte",
  qrVersion: 0,
  ...OBJECT_SIZE_DEFAULTS,
};


/** Scale image to this height when making a label thumbnail */
export const THUMBNAIL_HEIGHT = 48;

/** Generate thumbnail in jpeg format with this quality */
export const THUMBNAIL_QUALITY = 0.7;

export const APP_CONFIG_DEFAULTS: AppConfig = {
  fitMode: "stretch",
  iconListMode: "both",
  gridEnabled: false
};

export const CSV_DEFAULT = "var1,var2\n123,456\n777,888";
