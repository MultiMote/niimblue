import * as fabric from "fabric";
import { OBJECT_DEFAULTS, OBJECT_DEFAULTS_TEXT, OBJECT_DEFAULTS_VECTOR, OBJECT_SIZE_DEFAULTS } from "../defaults";
import Barcode from "../fabric-object/barcode";
import { QRCode } from "../fabric-object/qrcode";
import type { OjectType } from "../types";

export class LabelDesignerObjectHelper {
  static async addSvg(canvas: fabric.Canvas, svgCode: string): Promise<fabric.FabricObject | fabric.Group> {
    const { objects, options } = await fabric.loadSVGFromString(svgCode);
    const obj = fabric.util.groupSVGElements(
      objects.filter((o) => o !== null),
      options
    );
    obj.scaleToWidth(OBJECT_SIZE_DEFAULTS.width);
    obj.scaleToHeight(OBJECT_SIZE_DEFAULTS.height);
    obj.set({ ...OBJECT_DEFAULTS });
    canvas.add(obj);
    canvas.renderAll();
    return obj;
  }

  static async addImageFile(canvas: fabric.Canvas, file: File): Promise<fabric.FabricObject | fabric.Group> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (file.type.startsWith("image/svg")) {
        reader.readAsText(file, "UTF-8");
        reader.onload = (readerEvt: ProgressEvent<FileReader>) => {
          if (readerEvt?.target?.result) {
            this.addSvg(canvas, readerEvt.target.result as string).then(resolve);
          }
        };
        reader.onerror = (readerEvt: ProgressEvent<FileReader>) => {
          console.error(readerEvt);
          reject(new Error("File read error"));
        };
      } else if (file.type === "image/png" || file.type === "image/jpeg") {
        reader.readAsDataURL(file);
        reader.onload = (readerEvt: ProgressEvent<FileReader>) => {
          if (readerEvt?.target?.result) {
            fabric.FabricImage.fromURL(readerEvt.target.result as string).then((img) => {
              img.set({ ...OBJECT_DEFAULTS });
              img.scaleToHeight(OBJECT_SIZE_DEFAULTS.width);
              img.scaleToHeight(OBJECT_SIZE_DEFAULTS.height);
              canvas.add(img);
              resolve(img);
            });
          }
        };
        reader.onerror = (readerEvt: ProgressEvent<FileReader>) => {
          console.error(readerEvt);
          reject(new Error("File read error"));
        };
      }
    });
  }

  static async addImageWithFilePicker(fabricCanvas: fabric.Canvas): Promise<fabric.FabricObject | fabric.Group> {
    return new Promise((resolve) => {
      const input: HTMLInputElement = document.createElement("input");

      input.type = "file";

      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files !== null) {
          this.addImageFile(fabricCanvas, target.files[0]).then(resolve);
        }
      };

      input.click();
    });
  }

  static async addImageBlob(fabricCanvas: fabric.Canvas, img: Blob): Promise<fabric.FabricImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(img);
      reader.onload = (readerEvt: ProgressEvent<FileReader>) => {
        if (readerEvt?.target?.result) {
          fabric.FabricImage.fromURL(readerEvt.target.result as string).then((img) => {
            img.set({ left: 0, top: 0, snapAngle: OBJECT_DEFAULTS.snapAngle });
            fabricCanvas.add(img);
            resolve(img);
          });
        }
      };

      reader.onerror = (readerEvt: ProgressEvent<FileReader>) => {
        console.error(readerEvt);
        reject(new Error("Image read error"));
      };
    });
  }

  static async addObjectFromClipboard(
    fabricCanvas: fabric.Canvas,
    data: DataTransfer
  ): Promise<fabric.FabricObject | undefined> {
    // paste image
    for (const item of data.items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          return await LabelDesignerObjectHelper.addImageFile(fabricCanvas, file);
        }
      }
    }

    // paste text
    const text = data.getData("text");
    if (text) {
      const obj = LabelDesignerObjectHelper.addText(fabricCanvas, text);
      fabricCanvas.setActiveObject(obj);
      return obj;
    }
  }

  static addText(canvas: fabric.Canvas, text?: string, options?: Partial<fabric.TextboxProps>): fabric.Textbox {
    const obj = new fabric.Textbox(text ?? "Text", {
      ...OBJECT_DEFAULTS_TEXT,
      ...options,
    });
    canvas.add(obj);
    canvas.centerObject(obj);
    return obj;
  }

  static addStaticText(canvas: fabric.Canvas, text?: string, options?: Partial<fabric.TextProps>): fabric.FabricText {
    const obj = new fabric.FabricText(text ?? "Text", {
      ...OBJECT_DEFAULTS_TEXT,
      ...options,
    });
    canvas.add(obj);
    canvas.centerObject(obj);
    return obj;
  }

  static addHLine(canvas: fabric.Canvas): fabric.Line {
    const obj = new fabric.Line(
      [OBJECT_DEFAULTS.left, OBJECT_DEFAULTS.top, OBJECT_DEFAULTS.left + OBJECT_SIZE_DEFAULTS.width, OBJECT_DEFAULTS.top],
      { ...OBJECT_DEFAULTS_VECTOR }
    );
    obj.setControlsVisibility({
      tl: false,
      bl: false,
      tr: false,
      br: false,
      mt: false,
      mb: false,
    });
    canvas.add(obj);
    canvas.centerObjectV(obj);
    return obj;
  }

  static addCircle(canvas: fabric.Canvas): fabric.Circle {
    const obj = new fabric.Circle({
      ...OBJECT_DEFAULTS_VECTOR,
      radius: OBJECT_SIZE_DEFAULTS.width / 2,
    });
    canvas.add(obj);
    canvas.centerObjectV(obj);
    return obj;
  }

  static addRect(canvas: fabric.Canvas): fabric.Rect {
    const obj = new fabric.Rect({
      ...OBJECT_SIZE_DEFAULTS,
      ...OBJECT_DEFAULTS_VECTOR,
    });
    canvas.add(obj);
    canvas.centerObjectV(obj);
    return obj;
  }

  static addQrCode(canvas: fabric.Canvas): QRCode {
    const qr = new QRCode({
      text: "NiimBlue",
      ...OBJECT_SIZE_DEFAULTS,
      ...OBJECT_DEFAULTS,
    });
    canvas.add(qr);
    return qr;
  }

  static addBarcode(canvas: fabric.Canvas): Barcode {
    const barcode = new Barcode({
      ...OBJECT_DEFAULTS,
      text: "123456789012",
      height: OBJECT_SIZE_DEFAULTS.height,
      encoding: "CODE128B",
    });
    canvas.add(barcode);
    return barcode;
  }

  static addObject(canvas: fabric.Canvas, objType: OjectType): fabric.FabricObject | undefined {
    switch (objType) {
      case "text":
        return this.addText(canvas);
      case "line":
        return this.addHLine(canvas);
      case "circle":
        return this.addCircle(canvas);
      case "rectangle":
        return this.addRect(canvas);
      case "image":
        this.addImageWithFilePicker(canvas);
        return;
      case "qrcode":
        return this.addQrCode(canvas);
      case "barcode":
        return this.addBarcode(canvas);
    }
  }
}
