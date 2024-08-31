import { fabric } from 'fabric'
import { code128b, ean13 } from '../utils/barcode'

const PRESERVE_PROPERTIES = ['text', 'encoding', 'printText']
const EAN13_LONG_IDX: number[] = [0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94]
export type BarcodeCoding = 'EAN13' | 'CODE128B'
export interface IBarcodeOptions extends fabric.IObjectOptions {
  text?: string
  encoding?: BarcodeCoding
  printText?: boolean
}

export interface Barcode extends fabric.Object {
  text: string
  encoding: BarcodeCoding
  printText: boolean
  constructor(options?: IBarcodeOptions): void
  initialize(options?: IBarcodeOptions): Barcode
}

export const Barcode = fabric.util.createClass(fabric.Object, {
  type: 'Barcode',
  stateProperties: PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.stateProperties ?? [])),
  cacheProperties: PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.cacheProperties ?? [])),
  bandcode: '',

  /**
   * QRCode text
   * @var {string}
   */
  text: '',
  /** 
   * Encoding
   * @type {BarcodeCoding}
   */
  encoding: 'EAN13',
  /**
   * Print text
   * @type {boolean}
   */
  printText: true,

  initialize(options = {}) {
    this.callSuper('initialize', options);
    this._createBandCode();
  },

  _set(key: any, value: any) {
    this.callSuper('_set', key, value);
    switch (key) {
      case 'text':
      case 'encoding':
        this._createBandCode();
        break;
    }
    return this
  },

  _createBandCode() {
    if (this.encoding === 'EAN13') {
      const { text, bandcode } = ean13(this.text)
      this.text = text
      this.bandcode = bandcode
    } else {
      this.bandcode = code128b(this.text)
    }
    return this
  },

  _render(ctx: CanvasRenderingContext2D) {
    if (this.bandcode === '') return

    ctx.save();

    ctx.fillStyle = this.fill;
    const fontHeight = Math.round(Math.max(Math.min(this.height / 10, this.width / this.text.length * 1.5), 10))
    ctx.font = `${fontHeight}px Courier New`
    ctx.textBaseline = 'top'
    const fontWidth = ctx.measureText('0').width
    const w2 = this.width / 2, h2 = this.height / 2
    const realX = (x: number) => x - w2
    const realY = (y: number) => y - h2

    // render bandcode
    let dh = this.height, dp = 0, dw = this.width / this.bandcode.length
    if (this.printText) {
      if (this.encoding === 'EAN13') {
        dp = 2 * fontWidth
        dh = this.height - fontHeight * 0.5
      } else {
        dh = this.height - fontHeight
      }
      dw = (this.width - dp * 2) / this.bandcode.length
    }
    for (let i = 0; i < this.bandcode.length; i++) {
      const d = this.bandcode[i]
      if (d === '1') {
        if (this.encoding !== 'EAN13' || EAN13_LONG_IDX.includes(i))
          ctx.fillRect(realX(dp + i * dw), realY(0), dw, dh)
        else
          ctx.fillRect(realX(dp + i * dw), realY(0), dw, dh - fontHeight * 0.7)
      }
    }

    // render text
    if (this.printText) {
      const fastY = realY(this.height - fontHeight)
      if (this.encoding === 'EAN13') {
        let partW = 42 * dw
        const textSpace = (partW - fontWidth * 6 - dw * 1) / 5

        // first digit
        ctx.fillText(this.text[0], realX(fontWidth * 0.5), fastY)
        // part 1
        {
          const pl = fontWidth * 2 + dw * 4
          for (let i = 1; i < 7; i++) {
            const partI = i - 1
            ctx.fillText(this.text[i], realX(pl + fontWidth * partI + textSpace * partI), fastY)
          }
        }
        // part 2
        {
          const pl = fontWidth * 2 + dw * 8 + partW
          for (let i = 7; i < 13; i++) {
            const partI = i - 7
            ctx.fillText(this.text[i], realX(pl + fontWidth * partI + textSpace * partI), fastY)
          }
        }
        // last digit
        ctx.fillText('>', realX(this.width - fontWidth * 1.5), fastY)
      } else {
        const textSpace = (this.width - fontWidth * this.text.length) / (this.text.length - 1)
        for (let i = 0; i < this.text.length; i++) {
          ctx.fillText(this.text[i], realX(fontWidth * i + textSpace * i), fastY)
        }
      }
    }

    ctx.restore();
  },

  toObject(propertiesToInclude = []) {
    return this.callSuper('toObject', PRESERVE_PROPERTIES.concat(...propertiesToInclude));
  },
})
Barcode.ATTRIBUTE_NAMES = [];
Barcode.fromElement = () => { };
Barcode.fromObject = (object: any, callback: any) => {
  return fabric.Object._fromObject('Barcode', object, callback);
};

// @ts-ignore
fabric.Barcode = Barcode

export default Barcode