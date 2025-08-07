import QRCodeFactory from "qrcode-generator";
import * as fabric from "fabric";
import { OBJECT_DEFAULTS_TEXT, OBJECT_SIZE_DEFAULTS } from "../defaults";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type Mode = "Numeric" | "Alphanumeric" | "Byte" /* Default */ | "Kanji";
export type QrVersion =
  | 0 // Automatic
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30
  | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40
  ;

export const qrCodeDefaultValues: Partial<fabric.TClassProperties<QRCode>> = {
  text: "Text",
  ecl: "M",
  stroke: "#000000",
  fill: "#ffffff",
  mode: "Byte",
  qrVersion: 0,
  ...OBJECT_SIZE_DEFAULTS,
};

interface UniqueQRCodeProps {
  text: string;
  ecl: ErrorCorrectionLevel;
  mode: Mode;
  qrVersion: QrVersion;
}
export interface QRCodeProps extends fabric.FabricObjectProps, UniqueQRCodeProps {}
export interface SerializedQRCodeProps extends fabric.SerializedObjectProps, UniqueQRCodeProps {}
const QRCODE_PROPS = ["text", "ecl", "size", "mode", "qrVersion"] as const;

export class QRCode<
    Props extends fabric.TOptions<QRCodeProps> = Partial<QRCodeProps>,
    SProps extends SerializedQRCodeProps = SerializedQRCodeProps,
    EventSpec extends fabric.ObjectEvents = fabric.ObjectEvents
  >
  extends fabric.FabricObject<Props, SProps, EventSpec>
  implements QRCodeProps
{
  static override readonly type = "QRCode";

  /**
   * QRCode text
   * @type string
   * @default "Text"
   */
  declare text: string;

  /**
   * Error Correction Level
   * @type ErrorCorrectionLevel
   * @default "M"
   */
  declare ecl: ErrorCorrectionLevel;

  /**
   * Mode
   * @type Mode
   * @default "M"
   */
  declare mode: Mode;

  /**
   * Version
   * @type Mode
   * @default "M"
   */
  declare qrVersion: QrVersion;

  constructor(options?: Props) {
    super();
    Object.assign(this, qrCodeDefaultValues);
    this.setOptions(options);
    this.lockScalingFlip = true;
    this.setControlsVisibility({
      ml: false,
      mt: false,
      mr: false,
      mb: false,
      tl: false,
      tr: false,
      bl: false,
    });
  }

  override _set(key: string, value: any): this {
    super._set(key, value);
    if (key === "text" || key === "ecl") {
      this.dirty = true;
    }

    return this;
  }

  renderError(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = "black"
    ctx.translate(-this.width / 2, -this.height / 2); // make top-left origin
    ctx.translate(-0.5, -0.5); // blurry rendering fix
    ctx.fillRect(0, 0, this.width + 1, this.height + 1);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = `16px ${OBJECT_DEFAULTS_TEXT.fontFamily}`;
    ctx.fillText("ERR", 0, 0);
    ctx.restore();
  }

  override _render(ctx: CanvasRenderingContext2D): void {
    if (!this.text) {
      this.renderError(ctx);
      super._render(ctx);
      return;
    }

    const qr = QRCodeFactory(this.qrVersion, this.ecl);

    try {
      qr.addData(this.text, this.mode);
      qr.make();
    } catch (e) {
      console.error(e);
      this.renderError(ctx);
      super._render(ctx);
      return;
    }

    let qrScale = Math.floor(this.width / qr.getModuleCount());
    let qrWidth = qrScale * qr.getModuleCount();
    qrWidth -= qrWidth % 2; // avoid half-pixel rendering

    if (qrScale < 1 || qrWidth > this.width) {
      this.renderError(ctx);
      super._render(ctx);
      return;
    }

    ctx.save();
    ctx.translate(-qrWidth / 2, -qrWidth / 2); // make top-left origin
    ctx.translate(-0.5, -0.5); // blurry rendering fix

    // qr.renderTo2dContext() axis flipped so rendering manually
    const length = qr.getModuleCount();
    for (let row = 0; row < length; row++) {
      for (let col = 0; col < length; col++) {
        ctx.fillStyle = qr.isDark(row, col) ? "black" : "white";
        ctx.fillRect(col * qrScale, row * qrScale, qrScale, qrScale);
      }
    }

    ctx.restore();

    super._render(ctx);
  }

  override toObject(propertiesToInclude: any[] = []) {
    return super.toObject([...QRCODE_PROPS, ...propertiesToInclude]);
  }
}

fabric.classRegistry.setClass(QRCode, "QRCode");

export default QRCode;
