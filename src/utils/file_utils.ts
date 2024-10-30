import type { fabric } from "fabric";
import { ExportedLabelTemplateSchema, type ExportedLabelTemplate, type FabricJson, type LabelProps } from "../types";
import { OBJECT_DEFAULTS, THUMBNAIL_HEIGHT, THUMBNAIL_QUALITY } from "../defaults";

export class FileUtils {
  static timestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  static makeExportedLabel (canvas: fabric.Canvas,  labelProps: LabelProps): ExportedLabelTemplate {
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
      timestamp: this.timestamp()
    };
  };

  /** Convert label template to JSON and download it */
  static saveLabelAsJson(label: ExportedLabelTemplate) {
    const parsed = ExportedLabelTemplateSchema.parse(label);
    const timestamp = label.timestamp ?? this.timestamp();
    const json: string = JSON.stringify(parsed);
    const link = document.createElement("a");
    const file: Blob = new Blob([json], { type: "text/json" });
    link.href = URL.createObjectURL(file);
    link.download = `label_${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
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
    return new Promise((resolve) => {
      canvas.loadFromJSON(
        state,
        () => {
          canvas.backgroundColor = "#fff";
          canvas.requestRenderAll();
          resolve();
        },
        (src: object, obj: fabric.Object/*, error: any*/) => {
          obj.set({ snapAngle: OBJECT_DEFAULTS.snapAngle });
        }
      );
    });
  }
}
