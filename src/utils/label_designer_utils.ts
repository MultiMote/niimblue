import * as fabric from "fabric";
import { GRID_SIZE, OBJECT_DEFAULTS } from "../defaults";
import type { MoveDirection } from "../types";

export class LabelDesignerUtils {
  static async cloneSelection(canvas: fabric.Canvas): Promise<void> {
    const clonedList: fabric.FabricObject[] = [];

    const selection = canvas.getActiveObject();

    if (selection === undefined) {
      return;
    }

    let selected: fabric.FabricObject[] = canvas.getActiveObjects();

    for (const obj of selected) {
      const cloned = await obj.clone();

      if (selection instanceof fabric.ActiveSelection) {
        cloned.left += selection.left + selection.width / 2;
        cloned.top += selection.top + selection.height / 2;
      }

      cloned.top += GRID_SIZE;
      cloned.left += GRID_SIZE;
      cloned.snapAngle = OBJECT_DEFAULTS.snapAngle;

      clonedList.push(cloned);
    }

    canvas.add(...clonedList);

    const newSelection = new fabric.ActiveSelection(clonedList);
    canvas.setActiveObject(newSelection);
  }

  static moveSelection(canvas: fabric.Canvas, direction: MoveDirection, ctrl?: boolean) {
    const selected: fabric.FabricObject[] = canvas.getActiveObjects();
    const amount = ctrl ? 1 : GRID_SIZE;

    selected.forEach((obj) => {
      if (direction === "left") {
        // round to fix inter-pixel positions
        obj.left = Math.round(obj.left) - amount;
      } else if (direction === "right") {
        obj.left = Math.round(obj.left) + amount;
      } else if (direction === "up") {
        obj.top = Math.round(obj.top) - amount;
      } else if (direction === "down") {
        obj.top = Math.round(obj.top) + amount;
      }
      obj.setCoords();
    });
    canvas.requestRenderAll();
  }

  static deleteSelection(canvas: fabric.Canvas) {
    const selected: fabric.FabricObject[] = canvas.getActiveObjects();
    selected.forEach((obj) => {
      canvas.remove(obj);
    });
  }

  static isAnyInputFocused(canvas: fabric.Canvas): boolean {
    const focused: Element | null = document.activeElement;

    if (focused !== null && (focused.tagName === "INPUT" || focused.tagName === "TEXTAREA")) {
      return true;
    }
    const selected: fabric.FabricObject[] = canvas.getActiveObjects();
    const editing = selected.some((obj) => obj instanceof fabric.IText && obj.isEditing);

    if (editing) {
      return true;
    }

    return false;
  }
}
