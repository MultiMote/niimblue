import QRCodeSVG from "qrcode-svg";
import * as fabric from "fabric";
import { OBJECT_SIZE_DEFAULTS } from "../defaults";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export const qrCodeDefaultValues: Partial<fabric.TClassProperties<QRCode>> = {
  text: "Text",
  ecl: "M",
  stroke: "#000000",
  fill: "#ffffff",
  ...OBJECT_SIZE_DEFAULTS,
};

interface UniqueQRCodeProps {
  text: string;
  ecl: ErrorCorrectionLevel;
}
export interface QRCodeProps extends fabric.FabricObjectProps, UniqueQRCodeProps {}
export interface SerializedQRCodeProps extends fabric.SerializedObjectProps, UniqueQRCodeProps {}
const QRCODE_PROPS = ["text", "ecl", "size"] as const;

export class QRCode<
    Props extends fabric.TOptions<QRCodeProps> = Partial<QRCodeProps>,
    SProps extends SerializedQRCodeProps = SerializedQRCodeProps,
    EventSpec extends fabric.ObjectEvents = fabric.ObjectEvents
  >
  extends fabric.FabricObject<Props, SProps, EventSpec>
  implements QRCodeProps
{
  static override type = "QRCode";

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

  private _paths: fabric.util.TSimplePathData = [];

  constructor(options?: Props) {
    super();
    Object.assign(this, qrCodeDefaultValues);
    this.setOptions(options);
    this.setControlsVisibility({
      ml: false,
      mt: false,
      mr: false,
      mb: false,
    });
    this._createPathData();
  }

  _createPathData() {
    const qr = new QRCodeSVG({
      content: this.text,
      padding: 0,
      width: this.width,
      height: this.height,
      color: this.stroke!.toString(),
      background: this.fill!.toString(),
      ecl: this.ecl,
      join: true,
    });
    const svg = qr.svg();
    const match = /<path[^>]*?d=(["'])?((?:.(?!\1|>))*.?)\1?/.exec(svg);
    const path_str = match ? match[2] : "";
    this._paths = fabric.util.makePathSimpler(fabric.util.parsePath(path_str));
  }

  override _set(key: string, value: any): this {
    super._set(key, value);
    if (key === "text" || key === "ecl") {
      this._createPathData();
      this.dirty = true;
    }
    return this;
  }

  override _render(ctx: CanvasRenderingContext2D): void {
    if (this._paths.length === 0) {
      super._render(ctx);
      return;
    }

    const w2 = this.width / 2;
    const h2 = this.height / 2;

    ctx.beginPath();
    for (const path of this._paths) {
      const [action, x, y] = path;

      if (action === "M") {
        ctx.moveTo(x - w2, y - h2);
      } else if (action === "L") {
        ctx.lineTo(x - w2, y - h2);
      } else if (action === "C") {
        ctx.closePath();
        ctx.beginPath();
      }
    }
    ctx.closePath();

    ctx.save();
    ctx.fillStyle = this.stroke as string;
    ctx.fill();
    ctx.restore();

    super._render(ctx);
  }

  override toObject(propertiesToInclude: any[] = []) {
    return super.toObject([...QRCODE_PROPS, ...propertiesToInclude]);
  }
}

fabric.classRegistry.setClass(QRCode, "QRCode");

export default QRCode;
