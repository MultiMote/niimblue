import bwipjs from "bwip-js";
import * as fabric from "fabric";
import { OBJECT_SIZE_DEFAULTS } from "$/defaults";
import { CanvasUtils } from "$/utils/canvas_utils";

export const dataMatrixDefaultValues: Partial<fabric.TClassProperties<DataMatrix>> = {
  text: "Text",
  stroke: "#000000",
  fill: "#ffffff",
  ...OBJECT_SIZE_DEFAULTS,
};

interface UniqueDataMatrixProps {
  text: string;
}
export interface DataMatrixProps extends fabric.FabricObjectProps, UniqueDataMatrixProps {}
export interface SerializedDataMatrixProps extends fabric.SerializedObjectProps, UniqueDataMatrixProps {}
const DATAMATRIX_PROPS = ["text", "size"] as const;

export class DataMatrix<
    Props extends fabric.TOptions<DataMatrixProps> = Partial<DataMatrixProps>,
    SProps extends SerializedDataMatrixProps = SerializedDataMatrixProps,
    EventSpec extends fabric.ObjectEvents = fabric.ObjectEvents,
  >
  extends fabric.FabricObject<Props, SProps, EventSpec>
  implements DataMatrixProps
{
  static override readonly type = "DataMatrix";

  /**
   * DataMatrix text
   */
  declare text: string;

  constructor(options?: Props) {
    super();
    Object.assign(this, dataMatrixDefaultValues);
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
    if (key === "text") {
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

    let dmData: any;

    try {
      const res = bwipjs.raw({ bcid: "datamatrix", text: this.text });
      dmData = res?.[0];
      if (!dmData || !('pixs' in dmData)) throw new Error("Invalid bwip-js output");
    } catch (e) {
      console.error(e);
      CanvasUtils.renderError(ctx, this.width, this.height);
      super._render(ctx);
      return;
    }

    const { pixs, pixx, pixy } = dmData;
    
    // Choose scaling factor to map modules to canvas size
    const dmScaleX = Math.floor(this.width / pixx);
    const dmScaleY = Math.floor(this.height / pixy);
    const dmScale = Math.min(dmScaleX, dmScaleY);
    
    let dmWidth = dmScale * pixx;
    let dmHeight = dmScale * pixy;
    dmWidth -= dmWidth % 2; // avoid half-pixel rendering
    dmHeight -= dmHeight % 2;

    if (dmScale < 1 || dmWidth > this.width || dmHeight > this.height) {
      CanvasUtils.renderError(ctx, this.width, this.height);
      super._render(ctx);
      return;
    }

    ctx.save();
    
    const offsetX = -dmWidth / 2;
    const offsetY = -dmHeight / 2;
    ctx.translate(offsetX, offsetY); // center
    ctx.translate(-0.5, -0.5); // blurry rendering fix
    
    ctx.fillStyle = this.fill as string;
    ctx.fillRect(0, 0, dmWidth, dmHeight);
    
    ctx.fillStyle = "#000000";
    
    for (let y = 0; y < pixy; y++) {
      for (let x = 0; x < pixx; x++) {
        if (pixs[y * pixx + x]) {
          ctx.fillRect(x * dmScale, y * dmScale, dmScale, dmScale);
        }
      }
    }
    
    ctx.restore();

    super._render(ctx);
  }

  override toObject(propertiesToInclude: any[] = []) {
    return super.toObject([...DATAMATRIX_PROPS, ...propertiesToInclude]);
  }
}

fabric.classRegistry.setClass(DataMatrix, "DataMatrix");
