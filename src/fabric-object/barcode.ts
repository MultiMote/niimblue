import { BARCODE_WIDTH, OBJECT_DEFAULTS_TEXT, OBJECT_SIZE_DEFAULTS } from "$/defaults";
import { CanvasUtils } from "$/utils/canvas_utils";
import * as fabric from "fabric";
import JsBarcode from "jsbarcode";

const BARCODE_TEXT_MARGIN = 2;

export const BARCODE_ENCODINGS = [
  { value: "CODE128", label: "Code 128 (auto)" },
  { value: "CODE128A", label: "Code 128 A" },
  { value: "CODE128B", label: "Code 128 B" },
  { value: "CODE128C", label: "Code 128 C" },
  { value: "CODE39", label: "Code 39" },
  { value: "CODE93", label: "Code 93" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "EAN5", label: "EAN-5" },
  { value: "EAN2", label: "EAN-2" },
  { value: "UPC", label: "UPC-A" },
  { value: "UPCE", label: "UPC-E" },
  { value: "ITF14", label: "ITF-14" },
  { value: "ITF", label: "ITF" },
  { value: "MSI", label: "MSI" },
  { value: "MSI10", label: "MSI-10" },
  { value: "MSI11", label: "MSI-11" },
  { value: "MSI1010", label: "MSI-1010" },
  { value: "MSI1110", label: "MSI-1110" },
  { value: "pharmacode", label: "Pharmacode" },
  { value: "codabar", label: "Codabar" },
] as const;

export type BarcodeEncoding = (typeof BARCODE_ENCODINGS)[number]["value"];

export const barcodeDefaultValues: Partial<fabric.TClassProperties<Barcode>> = {
  text: "",
  encoding: "EAN13",
  printText: true,
  fontSize: 12,
  fontFamily: OBJECT_DEFAULTS_TEXT.fontFamily,
  width: BARCODE_WIDTH,
  height: OBJECT_SIZE_DEFAULTS.height,
};

interface UniqueBarcodeProps {
  text: string;
  encoding: BarcodeEncoding;
  printText: boolean;
  fontSize: number;
  fontFamily: string;
}
export interface BarcodeProps extends fabric.FabricObjectProps, UniqueBarcodeProps {}
export interface SerializedBarcodeProps extends fabric.SerializedObjectProps, UniqueBarcodeProps {}
const BARCODE_PROPS = ["text", "encoding", "printText", "fontSize", "fontFamily"] as const;

interface JsBarcodeEncoding {
  data: string;
  text: string;
  options?: {
    height?: number;
    textAlign?: string;
  };
}

interface JsBarcodeResult {
  encodings?: JsBarcodeEncoding[];
}

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
   * @type BarcodeEncoding
   * @default "EAN13"
   */
  declare encoding: BarcodeEncoding;
  /**
   * Print text
   * @type boolean
   * @default true
   */
  declare printText: boolean;
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

  private barcodeEncodings: JsBarcodeEncoding[] = [];
  private barcodeBarHeight: number = 0;
  private error: boolean = false;

  constructor(options?: Props) {
    super();
    Object.assign(this, barcodeDefaultValues);
    this.setOptions(options);
    this.setControlsVisibility({
      tl: false,
      tr: false,
      bl: false,
      br: false,
      ml: false,
      // mr: false,
      mtr: false,
    });
    this.lockScalingFlip = true;
    this.objectCaching = false;
    this._createBarcode();
  }

  override _set(key: string, value?: any): this {
    super._set(key, value);

    if (key === "text" || key === "encoding" || key === "printText" || key === "fontSize" || key === "fontFamily") {
      this._createBarcode();
    }

    return this;
  }

  private _createBarcode(): void {
    this.error = false;
    this.barcodeEncodings = [];
    this.barcodeBarHeight = 0;

    if (!this.text) {
      return;
    }

    const textHeight = this.printText ? this.fontSize + BARCODE_TEXT_MARGIN : 0;
    const barHeight = Math.max(1, this.height - textHeight);
    this.barcodeBarHeight = barHeight;

    try {
      const result: JsBarcodeResult = {};

      JsBarcode(result, this.text, {
        format: this.encoding,
        width: 1,
        height: barHeight,
        displayValue: this.printText,
        fontSize: this.printText ? this.fontSize : 0,
        textMargin: this.printText ? BARCODE_TEXT_MARGIN : 0,
        margin: 0,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        background: "",
        lineColor: "#000000",
        font: this.fontFamily,
        fontOptions: "bold",
        textAlign: "center",
      });

      if (!result.encodings?.length) {
        this.error = true;
        return;
      }

      this.barcodeEncodings = result.encodings;
    } catch (e) {
      console.error(e);
      this.error = true;
    }
  }

  private _getFont(): string {
    return `bold ${this.fontSize}px ${this.fontFamily}`;
  }

  private _hasBars(encoding: JsBarcodeEncoding): boolean {
    return encoding.data.includes("1");
  }

  private _renderTextPart(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    width: number,
    textAlign?: string,
  ): void {
    if (!text) {
      return;
    }

    if (textAlign === "left") {
      ctx.textAlign = "left";
      ctx.fillText(text, x, this.height);
      return;
    }

    if (textAlign === "right") {
      ctx.textAlign = "right";
      ctx.fillText(text, x + width, this.height);
      return;
    }

    ctx.textAlign = "left";

    if (text.length === 1) {
      ctx.fillText(text, x + (width - ctx.measureText(text).width) / 2, this.height);
      return;
    }

    CanvasUtils.equalSpacingFillText(ctx, text, x, this.height, width);
  }

  override _render(ctx: CanvasRenderingContext2D) {
    if (this.error || this.barcodeEncodings.length === 0) {
      CanvasUtils.renderError(ctx, this.width, this.height);
      super._render(ctx);
      return;
    }

    ctx.save();
    ctx.font = this._getFont();

    // Some formats (EAN-13, UPC-A) add empty segments that only reserve space for
    // the digits outside the guard bars. They must not shrink the actual barcode.
    let firstBarIndex = -1;
    let lastBarIndex = -1;
    for (let i = 0; i < this.barcodeEncodings.length; i++) {
      if (this._hasBars(this.barcodeEncodings[i])) {
        if (firstBarIndex === -1) {
          firstBarIndex = i;
        }
        lastBarIndex = i;
      }
    }

    if (firstBarIndex === -1) {
      ctx.restore();
      CanvasUtils.renderError(ctx, this.width, this.height);
      super._render(ctx);
      return;
    }

    const leadingText = this.barcodeEncodings
      .slice(0, firstBarIndex)
      .map((encoding) => encoding.text)
      .join("");

    const trailingText = this.barcodeEncodings
      .slice(lastBarIndex + 1)
      .map((encoding) => encoding.text)
      .join("");

    const leadingTextWidth = Math.ceil(ctx.measureText(leadingText).width);
    const trailingTextWidth = Math.ceil(ctx.measureText(trailingText).width);

    const barModules = this.barcodeEncodings.reduce(
      (total, encoding) => total + (this._hasBars(encoding) ? encoding.data.length : 0),
      0,
    );
    const barScale = Math.floor((this.width - leadingTextWidth - trailingTextWidth) / barModules);

    if (barScale < 1) {
      ctx.restore();
      CanvasUtils.renderError(ctx, this.width, this.height);
      super._render(ctx);
      return;
    }

    const barcodeWidth = barModules * barScale;
    const groupWidth = leadingTextWidth + barcodeWidth + trailingTextWidth;
    const groupStart = Math.floor((this.width - groupWidth) / 2);
    const barcodeStartPos = groupStart + leadingTextWidth;
    const textHeight = this.printText ? this.fontSize + BARCODE_TEXT_MARGIN : 0;
    const barHeight = Math.max(1, this.height - textHeight);
    const storedBarHeight = this.barcodeBarHeight || barHeight;

    ctx.translate(-this.width / 2, -this.height / 2); // make top-left origin
    ctx.translate(0.5, 0.5); // blurry rendering fix
    ctx.fillStyle = "black";

    // render barcode
    let xPos = barcodeStartPos;
    for (const encoding of this.barcodeEncodings) {
      if (!this._hasBars(encoding)) {
        continue;
      }

      // keep guard bars proportional when the object is resized after encoding
      const heightOffset = (encoding.options?.height ?? storedBarHeight) - storedBarHeight;
      const encodingBarHeight = Math.min(this.height, barHeight + heightOffset);
      let blackStartPosition = -1;

      for (let i = 0; i < encoding.data.length; i++) {
        const isBlack = encoding.data[i] === "1";

        if (isBlack && blackStartPosition === -1) {
          blackStartPosition = i;
        }

        if ((!isBlack || i === encoding.data.length - 1) && blackStartPosition !== -1) {
          const blackEndPosition = isBlack ? i + 1 : i;
          ctx.fillRect(
            xPos + blackStartPosition * barScale,
            0,
            (blackEndPosition - blackStartPosition) * barScale,
            encodingBarHeight,
          );
          blackStartPosition = -1;
        }
      }

      xPos += encoding.data.length * barScale;
    }

    // render text
    if (this.printText) {
      ctx.font = this._getFont();
      ctx.textBaseline = "bottom";

      xPos = barcodeStartPos;
      for (const encoding of this.barcodeEncodings) {
        if (!this._hasBars(encoding)) {
          continue;
        }

        const encodingWidth = encoding.data.length * barScale;
        this._renderTextPart(ctx, encoding.text, xPos, encodingWidth, encoding.options?.textAlign);
        xPos += encodingWidth;
      }

      if (leadingText) {
        ctx.textAlign = "left";
        ctx.fillText(leadingText, groupStart, this.height);
      }

      if (trailingText) {
        ctx.textAlign = "right";
        ctx.fillText(trailingText, groupStart + groupWidth, this.height);
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
