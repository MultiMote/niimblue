import { fabric } from "fabric";
import { DEFAULT_LABEL_PROPS } from "../defaults";
import type { LabelProps } from "../types";

export class CustomCanvas extends fabric.Canvas {
  private labelProps: LabelProps = DEFAULT_LABEL_PROPS;

  public setLabelProps(value: LabelProps) {
    this.labelProps = value;
    this.requestRenderAll();
  }

  override _renderBackground(ctx: CanvasRenderingContext2D) {
    if (this.width === undefined || this.height === undefined) {
      return;
    }

    ctx.save();

    ctx.fillStyle = "white";

    // Disable further actions for circle labels, just render
    if (this.labelProps.shape === "circle") {
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, this.height / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
      return;
    }

    let roundRadius = 10;
    let endX = this.width;
    let endY = this.height;
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

    if (this.labelProps.shape !== "rounded_rect") {
      roundRadius = 0;
    }

    // Draw tail
    ctx.fillStyle = "#CFCFCF";

    const tailWidth = 40;
    ctx.beginPath();
    if (this.labelProps.tailLength !== undefined) {
      if (this.labelProps.tailPos === "right") {
        ctx.fillRect(endX - roundRadius, endY / 2 - tailWidth / 2, this.width - endX + roundRadius, tailWidth);
      } else if (this.labelProps.tailPos === "bottom") {
        ctx.fillRect(endX / 2 - tailWidth / 2, endY - roundRadius, tailWidth, this.height - endY + roundRadius);
      } else if (this.labelProps.tailPos === "left") {
        ctx.fillRect(0, endY / 2 - tailWidth / 2, startX + roundRadius, tailWidth);
      } else if (this.labelProps.tailPos === "top") {
        ctx.fillRect(endX / 2 - tailWidth / 2, 0, tailWidth, startY + roundRadius);
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

    const separatorLineWidth = 2;

    ctx.strokeStyle = "#CFCFCF";
    ctx.lineWidth = separatorLineWidth;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();

    if (this.labelProps.split === "horizontal") {
      const lineY = startY / 2 + endY / 2 - separatorLineWidth / 2 + 1;
      ctx.moveTo(startX + roundRadius, lineY);
      ctx.lineTo(endX - roundRadius, lineY);
    } else if (this.labelProps.split === "vertical") {
      const lineX = startX / 2 + endX / 2 - separatorLineWidth / 2 + 1;
      ctx.moveTo(lineX, startY + roundRadius);
      ctx.lineTo(lineX, endY - roundRadius);
    }

    ctx.stroke();

    ctx.restore();
  }
}
