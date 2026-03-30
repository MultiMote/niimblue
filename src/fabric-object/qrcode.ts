import QRCodeFactory from "qrcode-generator";
import * as fabric from "fabric";
import { OBJECT_SIZE_DEFAULTS } from "$/defaults";
import { Range } from "$/types";
import { stringToBytes } from "$/utils/qrcode";
import { CanvasUtils } from "$/utils/canvas_utils";

QRCodeFactory.stringToBytes = stringToBytes;

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type Mode = "Numeric" | "Alphanumeric" | "Byte" /* Default */ | "Kanji";

export type QrVersion = Range<41>; // 0-40, 0 is automatic

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
    EventSpec extends fabric.ObjectEvents = fabric.ObjectEvents,
  >
  extends fabric.FabricObject<Props, SProps, EventSpec>
  implements QRCodeProps
{
  static override readonly type = "QRCode";

  /**
   * QRCode text
   */
  declare text: string;

  /**
   * Error Correction Level
   */
  declare ecl: ErrorCorrectionLevel;

  /**
   * Mode
   */
  declare mode: Mode;

  /**
   * Version
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

  override _render(ctx: CanvasRenderingContext2D): void {
    if (!this.text) {
      CanvasUtils.renderError(ctx, this.width, this.height);
      super._render(ctx);
      return;
    }

    const qr = QRCodeFactory(this.qrVersion, this.ecl);

    try {
      qr.addData(this.text, this.mode);
      qr.make();
    } catch (e) {
      console.error(e);
      CanvasUtils.renderError(ctx, this.width, this.height);
      super._render(ctx);
      return;
    }

    const qrScale = Math.floor(this.width / qr.getModuleCount());
    let qrWidth = qrScale * qr.getModuleCount();
    qrWidth -= qrWidth % 2; // avoid half-pixel rendering

    if (qrScale < 1 || qrWidth > this.width) {
      CanvasUtils.renderError(ctx, this.width, this.height);
      super._render(ctx);
      return;
    }

    ctx.save();
    ctx.translate(-qrWidth / 2, -qrWidth / 2); // make top-left origin
    ctx.translate(-0.5, -0.5); // blurry rendering fix
    qr.renderTo2dContext(ctx, qrScale);
    ctx.restore();

    super._render(ctx);
  }

  override toObject(propertiesToInclude: any[] = []) {
    return super.toObject([...QRCODE_PROPS, ...propertiesToInclude]);
  }
}

fabric.classRegistry.setClass(QRCode, "QRCode");

export default QRCode;
