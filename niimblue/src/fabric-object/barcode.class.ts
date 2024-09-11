import { fabric } from "fabric";
import { code128b, ean13 } from "../utils/barcode";
import { equalSpacingFillText } from "../utils/canvas_utils";

const PRESERVE_PROPERTIES = ["text", "encoding", "printText"];
const EAN13_LONG_IDX: number[] = [0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94];
export type BarcodeCoding = "EAN13" | "CODE128B";
export interface IBarcodeOptions extends fabric.IObjectOptions {
  text?: string;
  encoding?: BarcodeCoding;
  printText?: boolean;
}

export interface Barcode extends fabric.Object {
  text: string;
  encoding: BarcodeCoding;
  printText: boolean;
  constructor(options?: IBarcodeOptions): void;
  initialize(options?: IBarcodeOptions): Barcode;
}

export const Barcode = fabric.util.createClass(fabric.Object, {
  type: "Barcode",
  stateProperties: PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.stateProperties ?? [])),
  cacheProperties: PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.cacheProperties ?? [])),
  bandcode: "",

  /**
   * QRCode text
   * @var {string}
   */
  text: "",
  /**
   * Encoding
   * @type {BarcodeCoding}
   */
  encoding: "EAN13",
  /**
   * Print text
   * @type {boolean}
   */
  printText: true,

  initialize(options = {}) {
    this.callSuper("initialize", options);
    this._createBandCode();
  },

  _set(key: any, value: any) {
    this.callSuper("_set", key, value);
    switch (key) {
      case "text":
      case "encoding":
        this._createBandCode();
        break;
    }
    return this;
  },

  _createBandCode() {
    if (this.encoding === "EAN13") {
      const { text, bandcode } = ean13(this.text);
      this.text = text;
      this.bandcode = bandcode;
    } else {
      this.bandcode = code128b(this.text);
    }
    return this;
  },

  _render(ctx: CanvasRenderingContext2D) {
    if (this.bandcode === "") return;

    ctx.save();

    ctx.fillStyle = this.fill;
    const fontHeight = Math.round(Math.max(Math.min(this.height / 10, (this.width / this.text.length) * 1.5), 12));
    ctx.font = `bold ${fontHeight}px Noto Sans Variable`;
    ctx.textBaseline = "top";
    const fontWidth = ctx.measureText("0").width;
    const w2 = this.width / 2,
      h2 = this.height / 2;
    const realX = (x: number) => x - w2;
    const realY = (y: number) => y - h2;

    // render bandcode
    let dh = this.height,
      dp = 0,
      dw = this.width / this.bandcode.length;
    if (this.printText) {
      if (this.encoding === "EAN13") {
        dp = 2 * fontWidth;
      }
      dh = this.height - fontHeight * 1.2;
      dw = (this.width - dp * 2) / this.bandcode.length;
    }

    let blackStartPosition = -1;
    let blackCount = 0;
    let long = false;

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

        if (!long && this.encoding === "EAN13" && EAN13_LONG_IDX.includes(i)) {
          long = true;
        }

        if (blackStartPosition!= -1 && i === this.bandcode.length - 1) {
          ctx.fillRect(blackStartPosition, realY(0), dw * blackCount, long ? dh + fontHeight * 0.7 : dh);
        }
      } else {
        ctx.fillRect(blackStartPosition, realY(0), dw * blackCount, long ? dh + fontHeight * 0.7 : dh);

        blackStartPosition = -1;
        blackCount = 0;
        long = false;
      }
    }

    // render text
    if (this.printText) {
      const fastY = realY(this.height - fontHeight);
      if (this.encoding === "EAN13") {
        let partW = 41 * dw;
        ctx.fillText(this.text[0], realX(fontWidth * 0.5), fastY); // first digit
        equalSpacingFillText(ctx, this.text.slice(1, 7), realX(fontWidth * 2 + dw * 4), fastY, partW); // part 1
        equalSpacingFillText(ctx, this.text.slice(7, 13), realX(fontWidth * 2 + dw * 9 + partW), fastY, partW); // part 2
        ctx.fillText(">", realX(this.width - fontWidth * 1.5), fastY); // last digit
      } else {
        equalSpacingFillText(ctx, this.text, realX(0), fastY, this.width);
      }
    }

    ctx.restore();
  },

  toObject(propertiesToInclude = []) {
    return this.callSuper("toObject", PRESERVE_PROPERTIES.concat(...propertiesToInclude));
  },
});
Barcode.ATTRIBUTE_NAMES = [];
Barcode.fromElement = () => {};
Barcode.fromObject = (object: any, callback: any) => {
  return fabric.Object._fromObject("Barcode", object, callback);
};

// @ts-ignore
fabric.Barcode = Barcode;

export default Barcode;
