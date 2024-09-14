import { fabric } from "fabric";
import { code128b, ean13 } from "../utils/barcode";
import { equalSpacingFillText } from "../utils/canvas_utils";

const PRESERVE_PROPERTIES = ["text", "encoding", "printText"];
const EAN13_LONG_IDX: number[] = [0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94];

export type BarcodeCoding = "EAN13" | "CODE128B";

export interface IBarcodeOptions extends fabric.IObjectOptions {
  text: string;
  encoding?: BarcodeCoding;
  printText?: boolean;
}

export class Barcode extends fabric.Object {
  text: string;
  encoding: BarcodeCoding;
  printText: boolean;

  bandcode: string = "";
  displayText: string = "";

  constructor(options?: IBarcodeOptions) {
    super(options);
    this.type = "Barcode";
    this.stateProperties = PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.stateProperties ?? []));
    this.cacheProperties = PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.cacheProperties ?? []));

    this.text = options?.text ?? "";
    this.encoding = options?.encoding ?? "EAN13";
    this.printText = options?.printText ?? true;
    this._createBandCode();
  }

  override _set(key: string, value: any): this {
    super._set(key, value);
    if (key === "text" || key == "encoding") {
      this._createBandCode();
    }
    return this;
  }

  _createBandCode(): fabric.Object {
    if (this.encoding === "EAN13") {
      const { text, bandcode } = ean13(this.text);
      this.displayText = text;
      this.bandcode = bandcode;
    } else {
      this.displayText = this.text;
      this.bandcode = code128b(this.text);
    }
    return this;
  }

  //todo: remove magic numbers
  override _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);

    if (this.bandcode === "" || this.height === undefined || this.width === undefined) {
      return;
    }

    ctx.save();

    const fontHeight = Math.round(
      Math.max(Math.min(this.height / 10, (this.width / this.displayText.length) * 1.5), 12)
    );

    ctx.font = `bold ${fontHeight}px Noto Sans Variable`;
    ctx.textBaseline = "top";
    const fontWidth = ctx.measureText("0").width;
    const w2 = this.width / 2;
    const h2 = this.height / 2;
    const realX = (x: number) => x - w2;
    const realY = (y: number) => y - h2;

    let dh = this.height;
    let dp = 0;

    if (this.printText) {
      if (this.encoding === "EAN13") {
        dp = 2 * fontWidth;
      }
      dh = this.height - fontHeight * 1.2;
    } else if (this.encoding === "EAN13") {
      dh = this.height * 0.9;
    }

    const dw = (this.width - dp * 2) / this.bandcode.length;

    let blackStartPosition = -1;
    let blackCount = 0;
    let isLongBar = false;

    // render barcode
    // todo: snap barcode elements to the pixel grid (to make rendering sharp)
    for (let i = 0; i < this.bandcode.length; i++) {
      const isBlack = this.bandcode[i] === "1";
      const xPos = realX(dp + i * dw);

      if (isBlack) {
        blackCount++;

        if (blackStartPosition == -1) {
          blackStartPosition = xPos;
        }

        if (!isLongBar && this.encoding === "EAN13" && EAN13_LONG_IDX.includes(i)) {
          isLongBar = true;
        }

        if (blackStartPosition != -1 && i === this.bandcode.length - 1) { // last index
          const longBarHeight = this.printText ? dh + fontHeight * 0.7 : dh + this.height * 0.1;
          ctx.fillRect(blackStartPosition, realY(0), dw * blackCount, isLongBar ? longBarHeight : dh);
        }
      } else {
        const longBarHeight = this.printText ? dh + fontHeight * 0.7 : dh + this.height * 0.1;
        ctx.fillRect(blackStartPosition, realY(0), dw * blackCount, isLongBar ? longBarHeight : dh);

        blackStartPosition = -1;
        blackCount = 0;
        isLongBar = false;
      }
    }

    // render text
    if (this.printText) {
      const fastY = realY(this.height - fontHeight);
      if (this.encoding === "EAN13") {
        let partW = 41 * dw;
        ctx.fillText(this.displayText[0], realX(fontWidth * 0.5), fastY); // first digit
        equalSpacingFillText(ctx, this.displayText.slice(1, 7), realX(fontWidth * 2 + dw * 4), fastY, partW); // part 1
        equalSpacingFillText(ctx, this.displayText.slice(7, 13), realX(fontWidth * 2 + dw * 9 + partW), fastY, partW); // part 2
        ctx.fillText(">", realX(this.width - fontWidth * 1.5), fastY); // last digit
      } else {
        equalSpacingFillText(ctx, this.displayText, realX(0), fastY, this.width);
      }
    }

    ctx.restore();
  }

  override toObject(propertiesToInclude: string[] = []) {
    return super.toObject(PRESERVE_PROPERTIES.concat(...propertiesToInclude));
  }

  static fromObject(object: any, callback: Function): fabric.Object {
    return fabric.Object._fromObject("Barcode", object, callback);
  }
}

// @ts-ignore
fabric.Barcode = Barcode;

export default Barcode;
