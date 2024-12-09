import * as fabric from "fabric";
import {
  ExportedLabelTemplateSchema,
  LabelPresetSchema,
  type ExportedLabelTemplate,
  type FabricJson,
  type LabelPreset,
  type LabelProps,
} from "../types";
import { OBJECT_DEFAULTS, THUMBNAIL_HEIGHT, THUMBNAIL_QUALITY } from "../defaults";
import { z } from "zod";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Toasts } from "./toasts";
import { CustomCanvas } from "../fabric-object/custom_canvas";

export class FileUtils {
  static timestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /** Convert string to base64 string */
  static base64str(str: string): string {
    const bytes = new TextEncoder().encode(str);
    const binString = String.fromCodePoint(...bytes);
    return btoa(binString);
  }

  /** Convert object to base64 string */
  static base64obj(obj: unknown): string {
    const json: string = JSON.stringify(obj);
    return this.base64str(json);
  }

  static makeExportedLabel(canvas: fabric.Canvas, labelProps: LabelProps): ExportedLabelTemplate {
    const thumbnailBase64: string = canvas.toDataURL({
      width: canvas.width,
      height: canvas.height,
      left: 0,
      top: 0,
      multiplier: THUMBNAIL_HEIGHT / (canvas.height || 1),
      quality: THUMBNAIL_QUALITY,
      format: "jpeg",
    });

    return {
      canvas: canvas.toJSON(),
      label: labelProps,
      thumbnailBase64,
      timestamp: this.timestamp(),
    };
  }

  /** Convert label template to JSON and download it */
  static saveLabelAsJson(label: ExportedLabelTemplate) {
    const parsed = ExportedLabelTemplateSchema.parse(label);
    const timestamp = label.timestamp ?? this.timestamp();

    FileSharer.share({
      filename: `label_${timestamp}.json`,
      contentType: "application/json",
      base64Data: this.base64obj(parsed),
    }).catch((e) => {
      if (e.message !== "USER_CANCELLED") Toasts.error(e);
    });
  }

  /** Convert canvas to PNG and download it */
  static saveCanvasAsPng(canvas: fabric.Canvas) {
    const timestamp = this.timestamp();

    const url = canvas.toDataURL({
      width: canvas.width,
      height: canvas.height,
      left: 0,
      top: 0,
      format: "png",
      multiplier: 1,
    });

    FileSharer.share({
      filename: `label_${timestamp}.png`,
      contentType: "image/png",
      base64Data: url.split("base64,")[1],
    }).catch((e) => {
      if (e.message !== "USER_CANCELLED") Toasts.error(e);
    });
  }

  /** Convert label template to JSON and download it */
  static saveLabelPresetsAsJson(presets: LabelPreset[]) {
    const parsed = z.array(LabelPresetSchema).parse(presets);

    FileSharer.share({
      filename: `presets_${this.timestamp()}.json`,
      contentType: "application/json",
      base64Data: this.base64obj(parsed),
    }).catch((e) => {
      if (e.message !== "USER_CANCELLED") Toasts.error(e);
    });
  }

  /**
   * Open file picker and return file contents
   *
   * fixme: never ends if dialog closed
   *
   * */
  static async pickAndReadTextFile(acceptExtension: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const input: HTMLInputElement = document.createElement("input");
      const reader = new FileReader();

      input.type = "file";
      input.accept = `.${acceptExtension}`;

      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files !== null) {
          const file: File = target.files[0];
          const ext = file.name.split(".").pop();

          if (ext === acceptExtension) {
            reader.readAsText(file, "UTF-8");
            reader.onload = (readerEvt: ProgressEvent<FileReader>) => {
              if (readerEvt?.target?.result) {
                resolve(readerEvt.target.result as string);
              }
            };
            reader.onerror = (readerEvt: ProgressEvent<FileReader>) => {
              console.error(readerEvt);
              reject(new Error("Unable to load file"));
            };
          }
        }
      };
      input.click();
    });
  }

  static async loadCanvasState(canvas: fabric.Canvas, state: FabricJson): Promise<void> {
    await canvas.loadFromJSON(state, (_, obj) => {
      if ("set" in obj) obj.set({ snapAngle: OBJECT_DEFAULTS.snapAngle });
    });
    if (canvas instanceof CustomCanvas) {
      canvas.virtualZoom(canvas.getVirtualZoom());
    }
    canvas.requestRenderAll();
  }

  static printImageUrls(sources: string[]) {
    const imgs = sources.map((src) => `<img src="${src}"/>`);

    const html = `
    <html>
      <head>
        <style>
          html, body {
            margin: 0;
            padding: 0;
          }
          img {
            display: block;
            width: 100vw;
            height: 100vh;
            image-rendering: pixelated;
            ${imgs.length > 1 ? "page-break-after: always;" : ""}
          }
        </style>
      </head>
      <body>
        ${imgs.join("\n")}
      </body>
    </html>
    `;

    const iframe = document.createElement("iframe");

    iframe.onload = () => {
      const iframeWindow = iframe.contentWindow!;
      iframeWindow.onafterprint = () => iframe.remove();
      iframeWindow.print();
    };

    iframe.style.display = "none";
    iframe.src = "about:blank";
    iframe.srcdoc = html;

    document.body.appendChild(iframe);
  }
}
