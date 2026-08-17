import * as fabric from "fabric";
import { DEFAULT_LABEL_PROPS, GRID_SIZE } from "$/defaults";
import type { LabelProps } from "$/types";

type LabelBounds = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
};
type FoldSegment = { start: number; end: number };
type FoldInfo = {
  axis: "vertical" | "horizontal" | "none";
  points: number[];
  segments: FoldSegment[];
};
type MirrorInfo = { pos: fabric.Point; flip: boolean };

export class CustomCanvas extends fabric.Canvas {
  private labelProps: LabelProps = DEFAULT_LABEL_PROPS;
  private readonly SEPARATOR_LINE_WIDTH = 2;
  private readonly ROUND_RADIUS = 10;
  private readonly TAIL_WIDTH = 40;
  private readonly GRAY = "#CFCFCF";
  private readonly MIRROR_GHOST_COLOR = "rgba(0, 0, 0, 0.3)";
  private customBackground: boolean = true;
  private highlightMirror: boolean = true;
  private gridEnabled: boolean = false;
  private virtualZoomRatio: number = 1;
  onZoomChange?: (zoom: number) => void;
  private zoomCleanup?: () => void;

  constructor(
    el?: string | HTMLCanvasElement,
    options?: fabric.TOptions<fabric.CanvasOptions>,
  ) {
    super(el, options);
    this.setupZoomAndPan();
    this.preserveObjectStacking = true;
  }

  private getViewport(): HTMLElement | null {
    return this.getElement().closest(".canvas-stage") ?? this.getElement().parentElement;
  }

  private panBy(dx: number, dy: number) {
    const box = this.getViewport();
    if (!box) return;
    box.scrollLeft -= dx;
    box.scrollTop -= dy;
  }

  private setupZoomAndPan() {
    const viewport = this.getViewport();
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.shiftKey) {
        this.panBy(-(event.deltaX || event.deltaY), event.deltaX ? -event.deltaY : 0);
        return;
      }

      if (event.deltaY > 0) {
        this.virtualZoom(this.virtualZoomRatio * 0.95, event);
      } else if (event.deltaY < 0) {
        this.virtualZoom(this.virtualZoomRatio * 1.05, event);
      }
    };

    let panning = false;
    let lastX = 0;
    let lastY = 0;

    const canPanFrom = (event: PointerEvent) => {
      if (event.button === 1) return true;
      if (event.button !== 0) return false;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return false;
      return target.classList.contains("canvas-stage") || target.classList.contains("canvas-wrapper");
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!canPanFrom(event)) return;
      event.preventDefault();
      panning = true;
      lastX = event.clientX;
      lastY = event.clientY;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add("is-panning");
    };

    const blockMiddleClickDefault = (event: MouseEvent) => {
      if (event.button === 1) {
        event.preventDefault();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!panning) return;
      this.panBy(event.clientX - lastX, event.clientY - lastY);
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!panning) return;
      panning = false;
      viewport.classList.remove("is-panning");
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    };

    let initialPinchDistance = 0;
    let initialZoom = 1;
    let lastMidPoint = { x: 0, y: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        this.selection = false;
        this.discardActiveObject();

        const touch1 = e.touches[0]!;
        const touch2 = e.touches[1]!;

        initialPinchDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        initialZoom = this.getVirtualZoom();
        lastMidPoint = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();

      const touch1 = e.touches[0]!;
      const touch2 = e.touches[1]!;
      const currentMidPoint = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      const currentPinchDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

      if (initialPinchDistance > 0) {
        const newZoom = (currentPinchDistance / initialPinchDistance) * initialZoom;
        if (isFinite(newZoom) && newZoom > 0 && Math.abs(newZoom - this.virtualZoomRatio) > 0.02) {
          this.virtualZoom(newZoom, currentMidPoint);
        }
      }

      this.panBy(currentMidPoint.x - lastMidPoint.x, currentMidPoint.y - lastMidPoint.y);
      lastMidPoint = currentMidPoint;
    };

    const stopTouch = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        setTimeout(() => {
          this.selection = true;
        }, 10);
      }
    };

    viewport.addEventListener("wheel", onWheel, { passive: false, capture: true });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    viewport.addEventListener("mousedown", blockMiddleClickDefault);
    viewport.addEventListener("auxclick", blockMiddleClickDefault);
    viewport.addEventListener("touchstart", onTouchStart, { passive: false });
    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    viewport.addEventListener("touchend", stopTouch);
    viewport.addEventListener("touchcancel", stopTouch);

    this.zoomCleanup = () => {
      viewport.removeEventListener("wheel", onWheel, true);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      viewport.removeEventListener("mousedown", blockMiddleClickDefault);
      viewport.removeEventListener("auxclick", blockMiddleClickDefault);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
      viewport.removeEventListener("touchend", stopTouch);
      viewport.removeEventListener("touchcancel", stopTouch);
    };
  }

  override dispose() {
    this.zoomCleanup?.();
    this.zoomCleanup = undefined;
    return super.dispose();
  }

  public virtualZoom(newZoom: number, origin?: { clientX?: number; clientY?: number; x?: number; y?: number }) {
    const oldZoom = this.virtualZoomRatio;
    const clamped = Math.min(Math.max(0.25, newZoom), 4);
    const canvasEl = this.getElement();
    const scroller = this.getViewport();
    const originX = origin?.clientX ?? origin?.x;
    const originY = origin?.clientY ?? origin?.y;

    let focusX = 0;
    let focusY = 0;
    if (originX !== undefined && originY !== undefined && canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      focusX = originX - rect.left;
      focusY = originY - rect.top;
    }

    this.virtualZoomRatio = clamped;
    this.setDimensions(
      {
        width: this.virtualZoomRatio * this.getWidth() + "px",
        height: this.virtualZoomRatio * this.getHeight() + "px",
      },
      { cssOnly: true },
    );

    if (originX !== undefined && originY !== undefined && scroller && oldZoom > 0 && canvasEl) {
      const ratio = clamped / oldZoom;
      const rect = canvasEl.getBoundingClientRect();
      scroller.scrollLeft += rect.left + focusX * ratio - originX;
      scroller.scrollTop += rect.top + focusY * ratio - originY;
    }

    this.onZoomChange?.(this.virtualZoomRatio);
  }

  public virtualZoomIn(origin?: { clientX: number; clientY: number }) {
    this.virtualZoom(this.virtualZoomRatio * 1.05, origin);
  }

  public virtualZoomOut(origin?: { clientX: number; clientY: number }) {
    this.virtualZoom(this.virtualZoomRatio * 0.95, origin);
  }

  public getVirtualZoom(): number {
    return this.virtualZoomRatio;
  }

  public resetVirtualZoom() {
    this.virtualZoom(1);
    this.centerInViewport();
  }

  public centerInViewport() {
    const stage = this.getViewport();
    if (!stage) return;
    const apply = () => {
      stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
      stage.scrollTop = Math.max(0, (stage.scrollHeight - stage.clientHeight) / 2);
    };
    apply();
    requestAnimationFrame(apply);
  }

  public fitToViewport(padding: number | { top?: number; right?: number; bottom?: number; left?: number } = 20) {
    const stage = this.getViewport();
    if (!stage) return;
    const resolved =
      typeof padding === "number"
        ? { top: padding, right: padding, bottom: padding, left: padding }
        : { top: 20, right: 20, bottom: 20, left: 20, ...padding };
    const availW = stage.clientWidth - resolved.left - resolved.right;
    const availH = stage.clientHeight - resolved.top - resolved.bottom;
    if (availW <= 0 || availH <= 0) return;
    const fit = Math.min(1, availW / this.getWidth(), availH / this.getHeight());
    this.virtualZoom(fit);
    this.centerInViewport();
  }

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

  setGridEnabled(value: boolean) {
    this.gridEnabled = value;
    this.requestRenderAll();
  }

  /** Get label bounds without tail */
  getLabelBounds(): LabelBounds {
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

    const width = endX - startX;
    const height = endY - startY;

    return { startX, startY, endX, endY, width, height };
  }

  /** Get fold line position for splitted labels */
  getFoldInfo(): FoldInfo {
    const bb = this.getLabelBounds();
    const points: number[] = [];
    const segments: FoldSegment[] = [];
    const splitParts = this.labelProps.splitParts ?? 2;

    if (splitParts < 2) {
      return { axis: "none", points, segments };
    }

    if (this.labelProps.split === "horizontal") {
      const segmentHeight = bb.height / splitParts;
      let lastY: number = bb.startY;

      for (let i = 1; i < splitParts; i++) {
        const y =
          bb.startY + segmentHeight * i - this.SEPARATOR_LINE_WIDTH / 2 + 1;
        points.push(y);
        segments.push({ start: lastY, end: y });
        lastY = y;
      }

      segments.push({ start: lastY, end: bb.endY });

      return { axis: "horizontal", points, segments };
    } else if (this.labelProps.split === "vertical") {
      const segmentWidth = bb.width / splitParts;
      let lastX: number = bb.startX;

      for (let i = 1; i < splitParts; i++) {
        const x =
          bb.startX + segmentWidth * i - this.SEPARATOR_LINE_WIDTH / 2 + 1;
        points.push(x);
        segments.push({ start: lastX, end: x });
        lastX = x;
      }

      segments.push({ start: lastX, end: bb.endX });

      return { axis: "vertical", points, segments };
    }

    return { axis: "none", points, segments };
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
    const bb = this.getLabelBounds();
    const fold = this.getFoldInfo();

    if (this.labelProps.shape !== "rounded_rect") {
      roundRadius = 0;
    }

    // Draw tail
    ctx.fillStyle = this.GRAY;

    ctx.beginPath();
    if (
      this.labelProps.tailLength !== undefined &&
      this.labelProps.tailLength > 0
    ) {
      if (this.labelProps.tailPos === "right") {
        ctx.rect(
          bb.endX - roundRadius,
          bb.endY / 2 - this.TAIL_WIDTH / 2,
          this.width - bb.endX + roundRadius,
          this.TAIL_WIDTH,
        );
      } else if (this.labelProps.tailPos === "bottom") {
        ctx.rect(
          bb.endX / 2 - this.TAIL_WIDTH / 2,
          bb.endY - roundRadius,
          this.TAIL_WIDTH,
          this.height - bb.endY + roundRadius,
        );
      } else if (this.labelProps.tailPos === "left") {
        ctx.rect(
          0,
          bb.endY / 2 - this.TAIL_WIDTH / 2,
          bb.startX + roundRadius,
          this.TAIL_WIDTH,
        );
      } else if (this.labelProps.tailPos === "top") {
        ctx.rect(
          bb.endX / 2 - this.TAIL_WIDTH / 2,
          0,
          this.TAIL_WIDTH,
          bb.startY + roundRadius,
        );
      }
    }
    ctx.fill();

    // Draw label(s)
    ctx.fillStyle = "white";

    ctx.beginPath();

    const splitParts = this.labelProps.splitParts ?? 2;

    if (this.labelProps.shape === "rounded_rect") {
      if (this.labelProps.split === "horizontal") {
        const segmentHeight = bb.height / splitParts;
        ctx.roundRect(
          bb.startX,
          bb.startY,
          bb.width,
          segmentHeight,
          roundRadius,
        ); // First part
        fold.points.forEach((y) =>
          ctx.roundRect(bb.startX, y, bb.width, segmentHeight, roundRadius),
        ); // Other parts
      } else if (this.labelProps.split === "vertical") {
        const segmentWidth = bb.width / splitParts;
        ctx.roundRect(
          bb.startX,
          bb.startY,
          segmentWidth,
          bb.height,
          roundRadius,
        ); // First part
        fold.points.forEach((x) =>
          ctx.roundRect(x, bb.startY, segmentWidth, bb.height, roundRadius),
        ); // Other parts
      } else {
        ctx.roundRect(0, 0, this.width, this.height, roundRadius);
      }
    } else {
      ctx.rect(bb.startX, bb.startY, bb.width, bb.height);
    }

    ctx.fill();

    // Draw separator

    ctx.strokeStyle = this.GRAY;
    ctx.lineWidth = this.SEPARATOR_LINE_WIDTH;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();

    if (fold.axis === "horizontal") {
      fold.points.forEach((x) => {
        ctx.moveTo(bb.startX + roundRadius, x);
        ctx.lineTo(bb.endX - roundRadius, x);
      });
    } else if (fold.axis === "vertical") {
      fold.points.forEach((y) => {
        ctx.moveTo(y, bb.startY + roundRadius);
        ctx.lineTo(y, bb.endY - roundRadius);
      });
    }

    ctx.stroke();

    // Draw grid
    if (this.gridEnabled) {
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(100, 100, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();

      const step = GRID_SIZE * 5;
      for (let x = bb.startX + step; x < bb.endX; x += step) {
        ctx.moveTo(x, bb.startY);
        ctx.lineTo(x, bb.endY);
      }
      for (let y = bb.startY + step; y < bb.endY; y += step) {
        ctx.moveTo(bb.startX, y);
        ctx.lineTo(bb.endX, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }
  override _renderObjects(
    ctx: CanvasRenderingContext2D,
    objects: fabric.FabricObject[],
  ) {
    super._renderObjects(ctx, objects);

    if (!this.highlightMirror || this.getActiveObjects().length > 1) {
      return;
    }

    ctx.save();

    objects.forEach((obj) => {
      const infos = this.getMirroredObjectCoords(obj);
      infos.forEach((info) => {
        const bbox = obj.getBoundingRect();
        ctx.fillStyle = this.MIRROR_GHOST_COLOR;
        ctx.fillRect(
          info.pos.x - bbox.width / 2,
          info.pos.y - bbox.height / 2,
          bbox.width,
          bbox.height,
        );
        ctx.restore();
      });
    });
    ctx.restore();
  }

  /**
   * Return new object positions (origin is center) if object needs mirroring
   **/
  getMirroredObjectCoords(obj: fabric.FabricObject): MirrorInfo[] {
    const fold = this.getFoldInfo();
    const result: MirrorInfo[] = [];

    if (
      fold.axis === "none" ||
      !(this.labelProps.mirror === "flip" || this.labelProps.mirror === "copy")
    ) {
      return result;
    }

    const bounds = this.getLabelBounds();

    if (fold.axis === "vertical") {
      if (this.labelProps.mirror === "copy") {
        fold.points.forEach((x) => {
          const pos = obj.getPointByOrigin("center", "center");
          pos.setX(x + (pos.x - bounds.startX));
          result.push({ pos, flip: false });
        });
      } else if (
        this.labelProps.mirror === "flip" &&
        fold.points.length === 1
      ) {
        // Half split only supported
        const axisX = fold.points[0];
        const pos = obj.getPointByOrigin("center", "center");
        pos.setX(axisX + (axisX - pos.x));
        pos.setY(bounds.startY + bounds.endY - pos.y);
        result.push({ pos, flip: true });
      }
    } else if (fold.axis === "horizontal") {
      if (this.labelProps.mirror === "copy") {
        fold.points.forEach((y) => {
          const pos = obj.getPointByOrigin("center", "center");
          pos.setY(y + (pos.y - bounds.startY));
          result.push({ pos, flip: false });
        });
      } else if (
        this.labelProps.mirror === "flip" &&
        fold.points.length === 1
      ) {
        // Half split only supported
        const axisY = fold.points[0];
        const pos = obj.getPointByOrigin("center", "center");
        pos.setY(axisY + (axisY - pos.y));
        pos.setX(bounds.startX + bounds.endX - pos.x);
        result.push({ pos, flip: true });
      }
    }

    return result;
  }

  /** Clone mirrored objects and add them to canvas */
  async createMirroredObjects() {
    const objects = this.getObjects();
    for (const obj of objects) {
      const infos = this.getMirroredObjectCoords(obj);

      for (const info of infos) {
        const newObj = await obj.clone();
        newObj.setPositionByOrigin(info.pos, "center", "center");
        if (info.flip) {
          newObj.centeredRotation = true;
          newObj.rotate((newObj.angle + 180) % 360);
        }
        this.add(newObj);
      }
    }
  }

  /** Centers object horizontally in the canvas or label part */
  override centerObjectH(object: fabric.FabricObject): void {
    if ((this.labelProps.split ?? "none") !== "none") {
      const pos = object.getPointByOrigin("center", "center");
      const bounds = this.getLabelBounds();
      const fold = this.getFoldInfo();
      let centerX = bounds.startX + bounds.width / 2;

      if (fold.axis !== "horizontal") {
        fold.segments.forEach((seg) => {
          if (pos.x >= seg.start && pos.x <= seg.end) {
            centerX = seg.start + (seg.end - seg.start) / 2;
          }
        });
      }
      pos.setX(centerX);

      object.setPositionByOrigin(pos, "center", "center");
      return;
    }

    super.centerObjectH(object);
  }

  /** Centers object vertically in the canvas or label part */
  override centerObjectV(object: fabric.FabricObject): void {
    if ((this.labelProps.split ?? "none") !== "none") {
      const pos = object.getPointByOrigin("center", "center");
      const bounds = this.getLabelBounds();
      const fold = this.getFoldInfo();
      let centerY = bounds.startY + bounds.height / 2;

      if (fold.axis !== "vertical") {
        fold.segments.forEach((seg) => {
          if (pos.y >= seg.start && pos.y <= seg.end) {
            centerY = seg.start + (seg.end - seg.start) / 2;
          }
        });
      }

      pos.setY(centerY);
      object.setPositionByOrigin(pos, "center", "center");
      return;
    }

    super.centerObjectV(object);
  }
}
