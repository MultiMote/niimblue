import type { fabric } from "fabric";
import { ExportedLabelTemplateSchema, type ExportedLabelTemplate, type FabricJson, type LabelProps } from "../types";
import { OBJECT_DEFAULTS } from "../defaults";

export class FileUtils {
  /** Convert label template to JSON and download it */
  static saveLabelAsJson(canvas: fabric.Canvas, labelProps: LabelProps) {
    const timestamp = Math.floor(Date.now() / 1000);

    const labelRaw: ExportedLabelTemplate = {
      canvas: canvas.toJSON(),
      label: labelProps,
    };

    const label = ExportedLabelTemplateSchema.parse(labelRaw);
    const json: string = JSON.stringify(label);
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
        (src: object, obj: fabric.Object, error: any) => {
          obj.set({ snapAngle: OBJECT_DEFAULTS.snapAngle });
        }
      );
    });
  }
}
