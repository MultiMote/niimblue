import { fabric } from "fabric";
import { code128b, ean13 } from "../utils/barcode";
import { equalSpacingFillText } from "../utils/canvas_utils";
import { OBJECT_DEFAULTS_TEXT } from "../defaults";

const ALL_PROPERTIES = ["text", "encoding", "printText", "scaleFactor", "fontSize", "font", "fontFamily"];
const EAN13_LONG_BAR_INDEXES: number[] = [0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94];

export type BarcodeCoding = "EAN13" | "CODE128B";

export interface IBarcodeOptions extends fabric.IObjectOptions {
  text: string;
  encoding?: BarcodeCoding;
  printText?: boolean;
  scaleFactor?: number;
  fontSize?: number;
  fontFamily?: string;
}

export class Barcode extends fabric.Object {
  text: string;
  encoding: BarcodeCoding;
  printText: boolean;
  scaleFactor: number;
  fontSize: number;
  fontFamily: string;

  barcodeEncoded: string = "";
  displayText: string = "";

  constructor(options?: IBarcodeOptions) {
    super(options);
    this.type = "Barcode";
    this.stateProperties = ALL_PROPERTIES.concat(...(fabric.Object.prototype.stateProperties ?? []));
    this.cacheProperties = ALL_PROPERTIES.concat(...(fabric.Object.prototype.cacheProperties ?? []));
    this.objectCaching = false; // todo: fix cache (blur on scaleFactor change)

    this.setControlsVisibility({
      tl: false,
      tr: false,
      bl: false,
      br: false,
      ml: false,
      mr: false,
      mtr: false,
    });

    this.text = options?.text ?? "";
    this.encoding = options?.encoding ?? "EAN13";
    this.printText = options?.printText ?? true;
    this.scaleFactor = options?.scaleFactor ?? 1;
    this.fontSize = options?.fontSize ?? 12;
    this.fontFamily = options?.fontFamily ?? OBJECT_DEFAULTS_TEXT.fontFamily;
    this._createBandCode();
  }

  override _set(key: string, value: any): this {
    super._set(key, value);

    if (key === "text" || key == "encoding") {
      this._createBandCode();
    }

    if (this.barcodeEncoded && (ALL_PROPERTIES.includes(key) || key == "canvas")) {
      const letterWidth = this._measureLetterWidth();
      let barcodeWidth = (this.scaleFactor ?? 1) * this.barcodeEncoded.length;

      if (this.encoding === "EAN13") {
        barcodeWidth += letterWidth * 2; // side margins
      }
      super._set("width", barcodeWidth);
    }

    return this;
  }

  _createBandCode(): fabric.Object {
    if (this.encoding === "EAN13") {
      const { text, bandcode } = ean13(this.text);
      this.displayText = text;
      this.barcodeEncoded = bandcode;
    } else {
      this.displayText = this.text;
      this.barcodeEncoded = code128b(this.text);
    }
    return this;
  }

  _getFont(): string {
    return `bold ${this.fontSize}px ${this.fontFamily}`;
  }

  // parent canvas is needed for this operation
  _measureLetterWidth(): number {
    const ctx = this.canvas?.getContext();
    let w = 0;

    if (ctx !== undefined) {
      ctx.save();
      ctx.font = this._getFont();
      w = ctx.measureText("0").width;
      ctx.restore();
    }
    return Math.ceil(w);
  }

  override _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);

    if (
      this.barcodeEncoded === "" ||
      this.height === undefined ||
      this.width === undefined ||
      this.fontSize === undefined ||
      this.fontFamily === undefined
    ) {
      return;
    }

    const letterWidth = this._measureLetterWidth();

    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2); // make top-left origin
    ctx.translate(0.5, 0.5); // blurry rendering fix

    ctx.font = this._getFont();
    ctx.textBaseline = "bottom";

    const longBarHeight = this.height;
    let shortBarHeight = this.height;
    const barcodeStartPos = this.encoding === "EAN13" ? letterWidth : 0;

    if (this.printText) {
      shortBarHeight -= this.fontSize * 1.2;
    } else if (this.encoding === "EAN13") {
      shortBarHeight -= 8;
    }

    let blackStartPosition = -1;
    let blackCount = 0;
    let isLongBar = false;

    // render barcode
    for (let i = 0; i < this.barcodeEncoded.length; i++) {
      const isBlack = this.barcodeEncoded[i] === "1";
      const xPos = barcodeStartPos + i * this.scaleFactor;

      if (isBlack) {
        blackCount++;

        if (blackStartPosition == -1) {
          blackStartPosition = xPos;
        }

        if (this.encoding === "EAN13" && EAN13_LONG_BAR_INDEXES.includes(i)) {
          isLongBar = true;
        }

        if (blackStartPosition != -1 && i === this.barcodeEncoded.length - 1) {
          // last index
          ctx.fillRect(blackStartPosition, 0, this.scaleFactor * blackCount, isLongBar ? longBarHeight : shortBarHeight);
        }
      } else {
        ctx.fillRect(blackStartPosition, 0, this.scaleFactor * blackCount, isLongBar ? longBarHeight : shortBarHeight);
        blackStartPosition = -1;
        blackCount = 0;
        isLongBar = false;
      }
    }

    // render text
    if (this.printText) {
      if (this.encoding === "EAN13") {
        const parts = [this.displayText[0], this.displayText.slice(1, 7), this.displayText.slice(7, 13), ">"];
        const midPartWidth = 40;
        const longBars1End = 4;
        const longBars2End = 50;

        ctx.fillText(parts[0], 0, this.height); // first digit

        equalSpacingFillText(
          ctx,
          parts[1],
          letterWidth + longBars1End * this.scaleFactor,
          this.height,
          midPartWidth * this.scaleFactor
        ); // part 1

        equalSpacingFillText(
          ctx,
          parts[2],
          letterWidth + longBars2End * this.scaleFactor,
          this.height,
          midPartWidth * this.scaleFactor
        ); // part 2

        ctx.fillText(parts[3], this.width - letterWidth, this.height); // last digit
      } else {
        equalSpacingFillText(ctx, this.displayText, barcodeStartPos, this.height, this.width);
      }
    }

    ctx.restore();
  }

  override toObject(propertiesToInclude: string[] = []) {
    return super.toObject(ALL_PROPERTIES.concat(...propertiesToInclude));
  }

  static fromObject(object: any, callback: Function): fabric.Object {
    return fabric.Object._fromObject("Barcode", object, callback);
  }
}

// @ts-expect-error Dynamic field create
fabric.Barcode = Barcode;

export default Barcode;
