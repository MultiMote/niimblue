import { fabric } from "fabric";
import { DEFAULT_LABEL_PROPS } from "../defaults";
import type { LabelProps } from "../types";

export class CustomCanvas extends fabric.Canvas {
  private labelProps: LabelProps = DEFAULT_LABEL_PROPS;
  private readonly SEPARATOR_LINE_WIDTH = 2;
  private readonly ROUND_RADIUS = 10;
  private readonly TAIL_WIDTH = 40;
  private readonly GRAY = "#CFCFCF";
  private readonly MIRROR_GHOST_COLOR = "rgba(0, 0, 0, 0.3)";
  private customBackground: boolean = true;
  private highlightMirror: boolean = true;

  setLabelProps(value: LabelProps) {
    this.labelProps = value;
    this.requestRenderAll();
  }

  setCustomBackground(value: boolean) {
    this.customBackground = value;
  }

  setHighlightMirror(value: boolean) {
    this.highlightMirror = value;
  }

  /** Get label bounds without tail */
  getLabelBounds(): { startX: number; startY: number; endX: number; endY: number } {
    let endX = this.width ?? 1;
    let endY = this.height ?? 1;
    let startX = 0;
    let startY = 0;

    if (this.labelProps.tailPos === "right") {
      endX -= this.labelProps.tailLength ?? 0;
    } else if (this.labelProps.tailPos === "bottom") {
      endY -= this.labelProps.tailLength ?? 0;
    } else if (this.labelProps.tailPos === "left") {
      startX += this.labelProps.tailLength ?? 0;
    } else if (this.labelProps.tailPos === "top") {
      startY += this.labelProps.tailLength ?? 0;
    }

    return { startX, startY, endX, endY };
  }

  /** Get fold line position for splitted labels */
  getFoldLine(): { axis: "vertical" | "horizontal" | "none"; pos: number } {
    const { startX, startY, endX, endY } = this.getLabelBounds();

    if (this.labelProps.split === "horizontal") {
      const lineY = startY / 2 + endY / 2 - this.SEPARATOR_LINE_WIDTH / 2 + 1;
      return { axis: "horizontal", pos: lineY };
    } else if (this.labelProps.split === "vertical") {
      const lineX = startX / 2 + endX / 2 - this.SEPARATOR_LINE_WIDTH / 2 + 1;
      return { axis: "vertical", pos: lineX };
    }
    return { axis: "none", pos: 0 };
  }

  override _renderBackground(ctx: CanvasRenderingContext2D) {
    if (this.width === undefined || this.height === undefined) {
      return;
    }

    ctx.save();
    ctx.fillStyle = "white";

    // Draw simple white background and exit
    if (!this.customBackground) {
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Disable further actions for circle labels, just render
    if (this.labelProps.shape === "circle") {
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, this.height / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
      return;
    }

    let roundRadius = this.ROUND_RADIUS;
    const { startX, startY, endX, endY } = this.getLabelBounds();

    if (this.labelProps.shape !== "rounded_rect") {
      roundRadius = 0;
    }

    // Draw tail
    ctx.fillStyle = this.GRAY;

    ctx.beginPath();
    if (this.labelProps.tailLength !== undefined) {
      if (this.labelProps.tailPos === "right") {
        ctx.fillRect(endX - roundRadius, endY / 2 - this.TAIL_WIDTH / 2, this.width - endX + roundRadius, this.TAIL_WIDTH);
      } else if (this.labelProps.tailPos === "bottom") {
        ctx.fillRect(
          endX / 2 - this.TAIL_WIDTH / 2,
          endY - roundRadius,
          this.TAIL_WIDTH,
          this.height - endY + roundRadius
        );
      } else if (this.labelProps.tailPos === "left") {
        ctx.fillRect(0, endY / 2 - this.TAIL_WIDTH / 2, startX + roundRadius, this.TAIL_WIDTH);
      } else if (this.labelProps.tailPos === "top") {
        ctx.fillRect(endX / 2 - this.TAIL_WIDTH / 2, 0, this.TAIL_WIDTH, startY + roundRadius);
      }
    }
    ctx.fill();

    // Draw label(s)
    ctx.fillStyle = "white";

    ctx.beginPath();
    if (this.labelProps.shape === "rounded_rect") {
      if (this.labelProps.split === "horizontal") {
        ctx.roundRect(startX, startY, endX - startX, endY / 2 - startY / 2, roundRadius);
        ctx.roundRect(startX, endY / 2 + startY / 2, endX - startX, endY / 2 - startY / 2, roundRadius);
      } else if (this.labelProps.split === "vertical") {
        ctx.roundRect(startX, startY, endX / 2 - startX / 2, endY - startY, roundRadius);
        ctx.roundRect(endX / 2 + startX / 2, startY, endX / 2 - startX / 2, endY - startY, roundRadius);
      } else {
        ctx.roundRect(0, 0, this.width, this.height, roundRadius);
      }
    } else {
      ctx.fillRect(startX, startY, endX - startX, endY - startY);
    }
    ctx.fill();

    // Draw separator

    ctx.strokeStyle = this.GRAY;
    ctx.lineWidth = this.SEPARATOR_LINE_WIDTH;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();

    const fold = this.getFoldLine();

    if (fold.axis === "horizontal") {
      ctx.moveTo(startX + roundRadius, fold.pos);
      ctx.lineTo(endX - roundRadius, fold.pos);
    } else if (fold.axis === "vertical") {
      ctx.moveTo(fold.pos, startY + roundRadius);
      ctx.lineTo(fold.pos, endY - roundRadius);
    }

    ctx.stroke();

    ctx.restore();
  }
  override _renderObjects(ctx: CanvasRenderingContext2D, objects: fabric.Object[]) {
    super._renderObjects(ctx, objects);

    if (!this.highlightMirror || this.getActiveObjects().length > 1) {
      return;
    }

    ctx.save();

    objects.forEach((obj) => {
      const info = this.getMirroredObjectCoords(obj);
      if (info !== undefined) {
        const bbox = obj.getBoundingRect(true);
        ctx.beginPath();
        ctx.fillStyle = this.MIRROR_GHOST_COLOR;
        ctx.fillRect(info.pos.x - bbox.width / 2, info.pos.y - bbox.height / 2, bbox.width, bbox.height);
        ctx.fill();
        ctx.restore();
      }
    });
    ctx.restore();
  }

  /**
   * Return new object pos (origin is top-left) if object needs mirroring
   **/
  getMirroredObjectCoords(obj: fabric.Object): { pos: fabric.Point; flip: boolean } | undefined {
    const fold = this.getFoldLine();

    if (fold.axis === "none" || !(this.labelProps.mirror === "flip" || this.labelProps.mirror === "copy")) {
      return undefined;
    }

    let newObject = false;
    let flip = false;
    const pos = obj.getPointByOrigin("center", "center");
    const bounds = this.getLabelBounds();

    if (fold.axis === "vertical") {
      newObject = true;
      if (this.labelProps.mirror === "copy") {
        pos.setX(fold.pos + (pos.x - bounds.startX));
      } else if (this.labelProps.mirror === "flip") {
        flip = true;
        pos.setX(fold.pos + (fold.pos - pos.x));
        pos.setY(bounds.startY + bounds.endY - pos.y);
      }
    } else if (fold.axis === "horizontal") {
      newObject = true;
      if (this.labelProps.mirror === "copy") {
        pos.setY(fold.pos + (pos.y - bounds.startY));
      } else if (this.labelProps.mirror === "flip") {
        flip = true;
        pos.setY(fold.pos + (fold.pos - pos.y));
        pos.setX(bounds.startX + bounds.endX - pos.x);
      }
    }

    if (!newObject) {
      return undefined;
    }

    return { pos, flip };
  }

  createMirroredObjects() {
    this.forEachObject((obj: fabric.Object) => {
      const info = this.getMirroredObjectCoords(obj);

      if (info != undefined) {
        obj.clone((newObj: fabric.Object) => {
          newObj.setPositionByOrigin(info.pos, "center", "center");
          if (info.flip) {
            newObj.centeredRotation = true;
            newObj.rotate(180);
          }
          this.add(newObj);
        });
      }
    });
  }
}
