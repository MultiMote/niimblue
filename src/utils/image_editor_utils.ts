import { fabric } from "fabric";
import { QRCode } from "../fabric-object/qrcode.class";
import Barcode from "../fabric-object/barcode.class";
import type { OjectType } from "../types";
import type { ITextOptions, TextOptions } from "fabric/fabric-impl";

export class ImageEditorUtils {
  static readonly SIZE_DEFAULT: number = 64;
  static readonly OBJECT_DEFAULTS = {
    fill: "black",
    snapAngle: 10,
    top: 10,
    left: 10,
    // objectCaching: false
    strokeUniform: true,
    // noScaleCache: true,
  };

  public static addSvg(canvas: fabric.Canvas, svgCode: string): void {
    fabric.loadSVGFromString(svgCode, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options);

      obj.scaleToWidth(this.SIZE_DEFAULT).scaleToHeight(this.SIZE_DEFAULT);
      obj.set({ ...this.OBJECT_DEFAULTS, top: 0, left: 0 });

      canvas.add(obj).renderAll();
      canvas.renderAll();
    });
  }

  // todo: return object
  public static addImageFile(canvas: fabric.Canvas, file: File) {
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
            img.set({ left: 0, top: 0, snapAngle: 10 });
            img.scaleToHeight(this.SIZE_DEFAULT).scaleToHeight(this.SIZE_DEFAULT);
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

  public static addText(
    canvas: fabric.Canvas,
    text?: string,
    options?: ITextOptions
  ): fabric.IText {
    const obj = new fabric.IText(text ?? "Text", {
      ...this.OBJECT_DEFAULTS,
      fontFamily: "Noto Sans Variable",
      textAlign: "center",
      originX: "center",
      originY: "center",
      lineHeight: 1,
      ...options
    });
    canvas.add(obj);
    obj.center();
    return obj;
  }

  public static addStaticText(
    canvas: fabric.Canvas,
    text?: string,
    options?: TextOptions
  ): fabric.Text {
    const obj = new fabric.Text(text ?? "Text", {
      ...this.OBJECT_DEFAULTS,
      fontFamily: "Noto Sans Variable",
      textAlign: "center",
      originX: "center",
      originY: "center",
      lineHeight: 1,
      ...options
    });
    canvas.add(obj);
    obj.center();
    return obj;
  }

  public static addHLine(canvas: fabric.Canvas): fabric.Line {
    const obj = new fabric.Line([10, 10, 10 + this.SIZE_DEFAULT, 10], {
      ...this.OBJECT_DEFAULTS,
      stroke: "#000",
      strokeWidth: 3,
    });
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

  public static addCircle(canvas: fabric.Canvas): fabric.Circle {
    const obj = new fabric.Circle({
      ...this.OBJECT_DEFAULTS,
      radius: this.SIZE_DEFAULT / 2,
      fill: "transparent",
      stroke: "black",
      strokeWidth: 3,
    });
    canvas.add(obj);
    obj.centerV();
    return obj;
  }

  public static addRect(canvas: fabric.Canvas): fabric.Rect {
    const obj = new fabric.Rect({
      ...this.OBJECT_DEFAULTS,
      width: this.SIZE_DEFAULT,
      height: this.SIZE_DEFAULT,
      fill: "transparent",
      stroke: "black",
      strokeWidth: 3,
    });
    canvas.add(obj);
    obj.centerV();
    return obj;
  }

  public static addQrCode(canvas: fabric.Canvas): QRCode {
    const qr = new QRCode({
      text: "NiimBlue",
      top: this.OBJECT_DEFAULTS.top,
      left: this.OBJECT_DEFAULTS.left,
      width: this.SIZE_DEFAULT,
      height: this.SIZE_DEFAULT,
      snapAngle: this.OBJECT_DEFAULTS.snapAngle,
    });
    canvas.add(qr);
    return qr;
  }

  public static addBarcode(canvas: fabric.Canvas): Barcode {
    const barcode = new Barcode({
      top: this.OBJECT_DEFAULTS.top,
      left: this.OBJECT_DEFAULTS.left,
      text: "123456789012",
      width: (canvas.width ?? this.SIZE_DEFAULT) - this.OBJECT_DEFAULTS.left * 2,
      height: this.SIZE_DEFAULT,
      snapAngle: this.OBJECT_DEFAULTS.snapAngle,
      encoding: "CODE128B",
    });
    canvas.add(barcode);
    return barcode;
  }

  public static addObject(canvas: fabric.Canvas, objType: OjectType): fabric.Object | undefined {
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
