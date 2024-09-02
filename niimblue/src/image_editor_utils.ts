import { fabric } from "fabric";
import { QRCode } from "./fabric-object/qrcode.class";
import Barcode from "./fabric-object/barcode.class";

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

  public static addText(canvas: fabric.Canvas, text?: string): void {
    const obj = new fabric.IText(text ?? "Text", {
      ...this.OBJECT_DEFAULTS,
      fontFamily: "Arial",
      textAlign: "center",
      originX: "center", //added
      originY: "center",
      lineHeight: 1,
    });
    canvas.add(obj);
    obj.center();
  }

  public static addHLine(canvas: fabric.Canvas): void {
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
  }

  public static addCircle(canvas: fabric.Canvas): void {
    const obj = new fabric.Circle({
      ...this.OBJECT_DEFAULTS,
      radius: this.SIZE_DEFAULT / 2,
      fill: "transparent",
      stroke: "black",
      strokeWidth: 3,
    });
    canvas.add(obj);
    obj.centerV();
  }

  public static addRect(canvas: fabric.Canvas): void {
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
  }

  public static addQrCode(canvas: fabric.Canvas): void {
    const qr = new QRCode({
      text: "NiimBlue",
      size: ImageEditorUtils.SIZE_DEFAULT,
    });
    canvas.add(qr);
  }

  public static addBarcode(canvas: fabric.Canvas): void {
    const barcode = new Barcode({
      text: "1234567890128",
      width: ImageEditorUtils.SIZE_DEFAULT * 2,
      height: ImageEditorUtils.SIZE_DEFAULT,
      encoding: "EAN13",
    })
    canvas.add(barcode);
  }
}
