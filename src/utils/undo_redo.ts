import type { fabric } from "fabric";
import type { ExportedLabelTemplate, LabelProps } from "../types";

export type UndoState = { undoDisabled: boolean; redoDisabled: boolean };

export class UndoRedo {
  private readonly UNDO_MAX: number = 20;

  private buf: ExportedLabelTemplate[] = [];
  private index: number = 0;

  public paused: boolean = false;

  public onLabelUpdate?: (data: ExportedLabelTemplate) => Promise<void>;
  public onStateUpdate?: (state: UndoState) => void;

  constructor() {}

  private updateState() {
    this.onStateUpdate?.({
      undoDisabled: this.index === 0,
      redoDisabled: this.index >= this.buf.length - 1,
    });
  }
  async undo() {
    if (this.index > 0 && this.index < this.buf.length) {
      await this.onLabelUpdate?.(this.buf[this.index - 1]);
      this.index--;
    }
    this.updateState();
  }

  async redo() {
    if (this.index < this.buf.length - 1) {
      await this.onLabelUpdate?.(this.buf[this.index + 1]);
      this.index++;
    }
    this.updateState();
  }

  push(fabricCanvas: fabric.Canvas, labelProps: LabelProps) {
    if (this.paused) {
      return;
    }

    if (this.index !== this.buf.length - 1 && this.index > 0 && this.index <= this.buf.length) {
      this.buf = this.buf.slice(0, this.index + 1);
    }

    this.buf.push({
      label: labelProps,
      canvas: fabricCanvas.toJSON(),
    });

    if (this.buf.length > this.UNDO_MAX) {
      this.buf.shift();
    }

    this.index = this.buf.length - 1;
    this.updateState();
  }
}
