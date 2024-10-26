import { fabric } from "fabric";
import { GRID_SIZE, OBJECT_DEFAULTS } from "../defaults";
import type { MoveDirection } from "../types";

export class ImageEditorUtils {
  static cloneObject(canvas: fabric.Canvas, selected: fabric.Object): Promise<void> {
    return new Promise((resolve) => {
      selected.clone((obj: fabric.Object) => {
        obj.snapAngle = OBJECT_DEFAULTS.snapAngle;
        obj.top! += GRID_SIZE;
        obj.left! += GRID_SIZE;
        canvas.add(obj);
        canvas.setActiveObject(obj);
        resolve();
      });
    });
  }

  static moveSelection(canvas: fabric.Canvas, direction: MoveDirection, ctrl?: boolean) {
    const selected: fabric.Object[] = canvas.getActiveObjects();
    const amount = ctrl ? 1 : GRID_SIZE;

    selected.forEach((obj) => {
      if (direction === "left") {
        // round to fix inter-pixel positions
        obj.left = Math.round(obj.left!) - amount;
      } else if (direction === "right") {
        obj.left = Math.round(obj.left!) + amount;
      } else if (direction === "up") {
        obj.top = Math.round(obj.top!) - amount;
      } else if (direction === "down") {
        obj.top = Math.round(obj.top!) + amount;
      }
      obj.setCoords();
    });
    canvas.requestRenderAll();
  }

  static deleteSelection(canvas: fabric.Canvas) {
    const selected: fabric.Object[] = canvas.getActiveObjects();
    selected.forEach((obj) => {
      canvas.remove(obj);
    });
  }

  static isAnyInputFocused = (canvas: fabric.Canvas): boolean => {
    const focused: Element | null = document.activeElement;

    if (focused !== null && (focused.tagName === "INPUT" || focused.tagName === "TEXTAREA")) {
      return true;
    }

    const selected: fabric.Object[] = canvas.getActiveObjects();
    const editing = selected.some((obj) => obj instanceof fabric.IText && obj.isEditing);

    if (editing) {
      return true;
    }

    return false;
  };
}
