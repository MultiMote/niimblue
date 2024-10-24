import { fabric } from "fabric";
import type { ITextOptions, TextOptions } from "fabric/fabric-impl";
import Barcode from "../fabric-object/barcode.class";
import { QRCode } from "../fabric-object/qrcode.class";
import type { OjectType } from "../types";
import { OBJECT_DEFAULTS, OBJECT_DEFAULTS_TEXT, OBJECT_DEFAULTS_VECTOR, OBJECT_SIZE_DEFAULTS } from "../defaults";

export class ImageEditorObjectHelper {
  static addSvg(canvas: fabric.Canvas, svgCode: string): void {
    fabric.loadSVGFromString(svgCode, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options);
      obj.scaleToWidth(OBJECT_SIZE_DEFAULTS.width).scaleToHeight(OBJECT_SIZE_DEFAULTS.height);
      obj.set({ ...OBJECT_DEFAULTS });
      canvas.add(obj).renderAll();
      canvas.renderAll();
    });
  }

  // todo: return object
  static addImageFile(canvas: fabric.Canvas, file: File) {
    const reader = new FileReader();

    if (file.type.startsWith("image/svg")) {
      reader.readAsText(file, "UTF-8");
      reader.onload = (readerEvt: ProgressEvent<FileReader>) => {
        if (readerEvt?.target?.result) {
          this.addSvg(canvas, readerEvt.target.result as string);
        }
      };
      reader.onerror = (readerEvt: ProgressEvent<FileReader>) => {
        console.error(readerEvt);
      };
    } else if (file.type === "image/png" || file.type === "image/jpeg") {
      reader.readAsDataURL(file);
      reader.onload = (readerEvt: ProgressEvent<FileReader>) => {
        if (readerEvt?.target?.result) {
          fabric.Image.fromURL(readerEvt.target.result as string, (img: fabric.Image) => {
            img.set({ ...OBJECT_DEFAULTS });
            img.scaleToHeight(OBJECT_SIZE_DEFAULTS.width).scaleToHeight(OBJECT_SIZE_DEFAULTS.height);
            canvas.add(img);
          });
        }
      };
      reader.onerror = (readerEvt: ProgressEvent<FileReader>) => {
        console.error(readerEvt);
      };
    }
  }

  // todo: return object
  static addImageWithFilePicker(fabricCanvas: fabric.Canvas) {
    const input: HTMLInputElement = document.createElement("input");

    input.type = "file";

    input.onchange = (e: Event) => {
      let target = e.target as HTMLInputElement;
      if (target.files !== null) {
        let file: File = target.files[0];
        this.addImageFile(fabricCanvas, file);
      }
    };

    input.click();
  }

  static addText(canvas: fabric.Canvas, text?: string, options?: ITextOptions): fabric.IText {
    const obj = new fabric.IText(text ?? "Text", {
      ...OBJECT_DEFAULTS_TEXT,
      ...options,
    });
    canvas.add(obj);
    obj.center();
    return obj;
  }

  static addStaticText(canvas: fabric.Canvas, text?: string, options?: TextOptions): fabric.Text {
    const obj = new fabric.Text(text ?? "Text", {
      ...OBJECT_DEFAULTS_TEXT,
      ...options,
    });
    canvas.add(obj);
    obj.center();
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
    obj.centerV();
    return obj;
  }

  static addCircle(canvas: fabric.Canvas): fabric.Circle {
    const obj = new fabric.Circle({
      ...OBJECT_DEFAULTS_VECTOR,
      radius: OBJECT_SIZE_DEFAULTS.width / 2,
    });
    canvas.add(obj);
    obj.centerV();
    return obj;
  }

  static addRect(canvas: fabric.Canvas): fabric.Rect {
    const obj = new fabric.Rect({
      ...OBJECT_SIZE_DEFAULTS,
      ...OBJECT_DEFAULTS_VECTOR,
    });
    canvas.add(obj);
    obj.centerV();
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

  static addObject(canvas: fabric.Canvas, objType: OjectType): fabric.Object | undefined {
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
