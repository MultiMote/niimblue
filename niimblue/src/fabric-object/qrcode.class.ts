import QRCodeSVG from 'qrcode-svg'
import { fabric } from 'fabric'

const PRESERVE_PROPERTIES = ['text', 'size', 'ecl']

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QRCodeType extends fabric.Object {
  text: string
  size: number
  ecl: ErrorCorrectionLevel
}

export const QRCode = fabric.util.createClass(fabric.Object, {
  type: 'QRCode',
  stateProperties: PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.stateProperties ?? [])),
  cacheProperties: PRESERVE_PROPERTIES.concat(...(fabric.Object.prototype.cacheProperties ?? [])),
  paths: [],

  /**
   * QRCode text
   * @var {string}
   */
  text: '',
  /**
   * Error Correction Level
   * @var {'L' | 'M' | 'Q' | 'H'}
   */
  ecl: 'M' as ErrorCorrectionLevel,
  /**
   * QRCode size
   * @var {number}
   */
  size: 80,

  initialize(options = {}) {
    this.callSuper('initialize', options);
    this._createPathData();
  },

  _set(key: any, value: any) {
    this.callSuper('_set', key, value);
    switch (key) {
      case 'text':
      case 'qrPadding':
      case 'ecl':
        this._createPathData();
        break;
      case 'size':
        this._createPathData();
        this.set({
          width: value,
          height: value
        });
        break
    }

    return this
  },

  _createPathData() {
    const qr = new QRCodeSVG({
      content: this.text || '',
      padding: 0,
      width: this.size,
      height: this.size,
      color: this.stroke,
      background: this.fill,
      ecl: this.ecl,
      join: true
    });
    const svg = qr.svg();
    const match = /<path[^>]*?d=(["'])?((?:.(?!\1|>))*.?)\1?/.exec(svg);
    const path_str = match ? match[2] : '';
    this.paths = fabric.util.makePathSimpler(fabric.util.parsePath(path_str))
    return this
  },

  _render(ctx: CanvasRenderingContext2D) {
    const w2 = this.width / 2, h2 = this.height / 2

    ctx.beginPath()
    for (const path of this.paths) {
      const action = path[0]
      const x = path[1]
      const y = path[2]
      if (action === 'M') ctx.moveTo(x - w2, y - h2)
      else if (action === 'L') ctx.lineTo(x - w2, y - h2)
      else if (action === 'C') {
        ctx.closePath()
        ctx.beginPath()
      }
    }
    ctx.closePath()

    ctx.save();
    ctx.fillStyle = this.stroke;
    ctx.fill();
    ctx.restore();
  },

  toObject(propertiesToInclude = []) {
    return this.callSuper('toObject', PRESERVE_PROPERTIES.concat(...propertiesToInclude));
  },

  _toSVG() {
    const x = - (this.width / 2);
    const y = - (this.height / 2);
    const path = fabric.util.joinPath(this.paths);

    return [
      '<rect style="fill:', this.fill, ';" ',
      'x="', x, '" y="', y,
      '" width="', this.width, '" height="', this.height,
      '" />\n',
      '<path style="fill:', this.stroke, ';" ',
      'transform="translate(', x, ', ', y, ')" ',
      'd="', path, '"',
      ' />\n',
    ];
  },
})

QRCode.ATTRIBUTE_NAMES = [];
QRCode.fromElement = () => { };
QRCode.fromObject = (object: any, callback: any) => {
  return fabric.Object._fromObject('QRCode', object, callback);
};

// @ts-ignore
fabric.QRCode = QRCode

export default QRCode