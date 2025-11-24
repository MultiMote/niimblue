import * as fabric from "fabric";
import { code128b, ean13 } from "../utils/barcode";
import { equalSpacingFillText } from "../utils/canvas_utils";
import { OBJECT_DEFAULTS_TEXT } from "../defaults";

const EAN13_LONG_BAR_INDEXES: number[] = [
  0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94,
];
export type BarcodeCoding = "EAN13" | "CODE128B";

export const barcodeDefaultValues: Partial<fabric.TClassProperties<Barcode>> = {
  text: "",
  encoding: "EAN13",
  printText: true,
  scaleFactor: 1,
  fontSize: 12,
  fontFamily: OBJECT_DEFAULTS_TEXT.fontFamily,
};

interface UniqueBarcodeProps {
  text: string;
  encoding: BarcodeCoding;
  printText: boolean;
  scaleFactor: number;
  fontSize: number;
  fontFamily: string;
}
export interface BarcodeProps
  extends fabric.FabricObjectProps,
    UniqueBarcodeProps {}
export interface SerializedBarcodeProps
  extends fabric.SerializedObjectProps,
    UniqueBarcodeProps {}
const BARCODE_PROPS = [
  "text",
  "encoding",
  "printText",
  "scaleFactor",
  "fontSize",
  "fontFamily",
] as const;

export class Barcode<
    Props extends fabric.TOptions<BarcodeProps> = Partial<BarcodeProps>,
    SProps extends SerializedBarcodeProps = SerializedBarcodeProps,
    EventSpec extends fabric.ObjectEvents = fabric.ObjectEvents,
  >
  extends fabric.FabricObject<Props, SProps, EventSpec>
  implements BarcodeProps
{
  static override type = "Barcode";

  /**
   * Barcode text
   * @type string
   * @default ""
   */
  declare text: string;
  /**
   * Barcode encoding
   * @type BarcodeCoding
   * @default "EAN13"
   */
  declare encoding: BarcodeCoding;
  /**
   * Print text
   * @type boolean
   * @default true
   */
  declare printText: boolean;
  /**
   * Scale factor
   * @type number
   * @default 1
   */
  declare scaleFactor: number;
  /**
   * Font size
   * @type number
   * @default 12
   */
  declare fontSize: number;
  /**
   * Font family
   * @type string
   * @default "Noto Sans Variable"
   */
  declare fontFamily: string;

  private barcodeEncoded: string = "";
  private displayText: string = "";

  constructor(options?: Props) {
    super();
    Object.assign(this, barcodeDefaultValues);
    const { text, ...other } = options ?? {};
    this.setOptions(other); // Must be set separately because the encoding needs to be set first
    this.set("text", text);
    this.setControlsVisibility({
      tl: false,
      tr: false,
      bl: false,
      br: false,
      ml: false,
      mr: false,
      mtr: false,
    });
    this.objectCaching = false;
    this._createBandCode();
  }

  override _set(key: string, value?: any): this {
    super._set(key, value);

    if (key === "text" || key == "encoding") {
      this._createBandCode();
    }

    if (
      this.barcodeEncoded &&
      (BARCODE_PROPS.includes(key as any) || key == "canvas")
    ) {
      const letterWidth = this._measureLetterWidth();
      let barcodeWidth = (this.scaleFactor ?? 1) * this.barcodeEncoded.length;

      if (this.encoding === "EAN13") {
        barcodeWidth += letterWidth * 2; // side margins
      }
      super.set("width", barcodeWidth);
      this.setCoords();
    }

    return this;
  }

  _createBandCode() {
    if (this.encoding === "EAN13") {
      const { text, bandcode } = ean13(this.text);
      this.displayText = text;
      this.barcodeEncoded = bandcode;
    } else {
      this.displayText = this.text;
      this.barcodeEncoded = code128b(this.text);
    }
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
    if (this.barcodeEncoded === "") {
      super._render(ctx);
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
          ctx.fillRect(
            blackStartPosition,
            0,
            this.scaleFactor * blackCount,
            isLongBar ? longBarHeight : shortBarHeight,
          );
        }
      } else {
        ctx.fillRect(
          blackStartPosition,
          0,
          this.scaleFactor * blackCount,
          isLongBar ? longBarHeight : shortBarHeight,
        );
        blackStartPosition = -1;
        blackCount = 0;
        isLongBar = false;
      }
    }

    // render text
    if (this.printText) {
      if (this.encoding === "EAN13") {
        const parts = [
          this.displayText[0],
          this.displayText.slice(1, 7),
          this.displayText.slice(7, 13),
          ">",
        ];
        const midPartWidth = 40;
        const longBars1End = 4;
        const longBars2End = 50;

        ctx.fillText(parts[0], 0, this.height); // first digit

        equalSpacingFillText(
          ctx,
          parts[1],
          letterWidth + longBars1End * this.scaleFactor,
          this.height,
          midPartWidth * this.scaleFactor,
        ); // part 1

        equalSpacingFillText(
          ctx,
          parts[2],
          letterWidth + longBars2End * this.scaleFactor,
          this.height,
          midPartWidth * this.scaleFactor,
        ); // part 2

        ctx.fillText(parts[3], this.width - letterWidth, this.height); // last digit
      } else {
        equalSpacingFillText(
          ctx,
          this.displayText,
          barcodeStartPos,
          this.height,
          this.width,
        );
      }
    }

    ctx.restore();

    super._render(ctx);
  }

  override toObject(propertiesToInclude: any[] = []) {
    return super.toObject([...BARCODE_PROPS, ...propertiesToInclude]);
  }
}

fabric.classRegistry.setClass(Barcode, "Barcode");

export default Barcode;
