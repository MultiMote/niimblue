import QRCodeSVG from "qrcode-svg";
import { fabric } from "fabric";

const PRESERVE_PROPERTIES = ["text", "size", "ecl"];

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface IQRCodeOptions extends fabric.IObjectOptions {
  text: string;
  ecl?: ErrorCorrectionLevel;
}

export class QRCode extends fabric.Object {
  /** QRCode text */
  text: string;
  /** Error Correction Level */
  ecl: ErrorCorrectionLevel;

  paths: fabric.PathCommand[];

  constructor(options?: IQRCodeOptions) {
    super(options);
    this.type = "QRCode";
    this.stateProperties = PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.stateProperties ?? []));
    this.cacheProperties = PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.cacheProperties ?? []));

    this.setControlsVisibility({
      ml: false,
      mr: false,
      mt: false,
      mb: false,
    });

    this.paths = [];
    this.text = options?.text ?? "Text";
    this.ecl = options?.ecl ?? "M";

    this._createPathData();
  }

  override _set(key: string, value: any): this {
    super._set(key, value);

    if (key === "text" || key === "ecl") {
      this._createPathData();
    }

    return this;
  }

  _createPathData() {
    if (this.text === "" || this.height === undefined || this.width === undefined || this.ecl === undefined) {
      return;
    }
    const qr = new QRCodeSVG({
      content: this.text,
      padding: 0,
      width: this.width,
      height: this.height,
      color: this.stroke!,
      background: this.fill! as string,
      ecl: this.ecl,
      join: true,
    });

    const svg = qr.svg();
    const match = /<path[^>]*?d=(["'])?((?:.(?!\1|>))*.?)\1?/.exec(svg);
    const path_str = match ? match[2] : "";
    this.paths = fabric.util.makePathSimpler(fabric.util.parsePath(path_str));
  }

  override _render(ctx: CanvasRenderingContext2D) {
    if (this.height === undefined || this.width === undefined) {
      return;
    }

    const w2 = this.width / 2;
    const h2 = this.height / 2;

    ctx.beginPath();

    for (const path of this.paths) {
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
  }

  override toObject(propertiesToInclude: string[] = []) {
    return super.toObject(PRESERVE_PROPERTIES.concat(...propertiesToInclude));
  }

  static fromObject(object: any, callback: Function): fabric.Object {
    return fabric.Object._fromObject("QRCode", object, callback);
  }
}

// @ts-expect-error Dynamic field create
fabric.QRCode = QRCode;

export default QRCode;
