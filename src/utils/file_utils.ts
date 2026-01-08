import * as fabric from "fabric";
import {
  ExportedLabelTemplateSchema,
  LabelPresetSchema,
  type ExportedLabelTemplate,
  type FabricJson,
  type LabelPreset,
  type LabelProps,
} from "$/types";
import { OBJECT_DEFAULTS, THUMBNAIL_HEIGHT, THUMBNAIL_QUALITY } from "$/defaults";
import { z } from "zod";
import { CustomCanvas } from "$/fabric-object/custom_canvas";
import { Capacitor } from "@capacitor/core";
import { fixFabricObjectScale } from "$/utils/canvas_utils";
import { LocalStoragePersistence } from "./persistence";
import { csvData } from "$/stores";
import { get } from "svelte/store";

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

  /** Convert base64 string to bytes */
  static base64toBytes(b64str: string): Uint8Array<ArrayBuffer> {
    const binaryString = atob(b64str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.codePointAt(i)!;
    }
    return bytes;
  }

  static async downloadBase64Web(filename: string, mime: string, base64Data: string) {
    const byteChars = atob(base64Data);
    const byteNumbers = new Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }

    const arr = new Uint8Array(byteNumbers);
    const blob = new Blob([arr], { type: mime });

    const a = document.createElement("a");
    a.download = filename;
    a.href = URL.createObjectURL(blob);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 10_000);
  }

  static async downloadBase64Capacitor(filename: string, base64Data: string) {
    const { Directory, Filesystem } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    const result = await Filesystem.writeFile({
      data: base64Data,
      path: filename,
      directory: Directory.Cache,
    });

    await Share.share({
      title: filename,
      text: filename,
      url: result.uri,
    });
  }

  static async downloadBase64(filename: string, mime: string, base64Data: string) {
    if (Capacitor.getPlatform() !== "web") {
      this.downloadBase64Capacitor(filename, base64Data);
      return;
    }

    this.downloadBase64Web(filename, mime, base64Data);
  }

  static makeExportedLabel(canvas: fabric.Canvas, labelProps: LabelProps, includeCsv: boolean): ExportedLabelTemplate {
    const thumbnailBase64: string = canvas.toDataURL({
      width: canvas.width,
      height: canvas.height,
      left: 0,
      top: 0,
      multiplier: THUMBNAIL_HEIGHT / (canvas.height || 1),
      quality: THUMBNAIL_QUALITY,
      format: "jpeg",
    });

    const tpl: ExportedLabelTemplate = {
      canvas: canvas.toJSON(),
      label: labelProps,
      thumbnailBase64,
      timestamp: this.timestamp(),
    };

    if (includeCsv) {
      tpl.csv = get(csvData);
    }

    tpl.id = LocalStoragePersistence.createUidForLabel(tpl);

    return tpl;
  }

  /** Convert label template to JSON and download it */
  static saveLabelAsJson(label: ExportedLabelTemplate) {
    const parsed = ExportedLabelTemplateSchema.omit({ id: true }).parse(label);
    const timestamp = label.timestamp ?? this.timestamp();
    let filename = `label_${timestamp}.json`;

    if (parsed.title && parsed.title.trim().length > 0) {
      filename = `${parsed.title}.json`;
    }

    this.downloadBase64(filename, "application/json", this.base64obj(parsed));
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

    this.downloadBase64(`label_${timestamp}.png`, "image/png", url.split("base64,")[1]);
  }

  /** Convert label template to JSON and download it */
  static saveLabelPresetsAsJson(presets: LabelPreset[]) {
    const parsed = z.array(LabelPresetSchema).parse(presets);
    this.downloadBase64(`presets_${this.timestamp()}.json`, "application/json", this.base64obj(parsed));
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

  /**
   * Open file picker and return file contents
   *
   * fixme: never ends if dialog closed
   *
   * */
  static async pickAndReadBinaryFile(acceptExtension: string): Promise<{ name: string; data: Uint8Array }> {
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
            reader.readAsArrayBuffer(file);
            reader.onload = (readerEvt: ProgressEvent<FileReader>) => {
              if (readerEvt?.target?.result) {
                resolve({ name: file.name, data: new Uint8Array(readerEvt.target.result as ArrayBuffer) });
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
      if (obj instanceof fabric.FabricObject) {
        obj.set({ snapAngle: OBJECT_DEFAULTS.snapAngle });
        fixFabricObjectScale(obj);
      }
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

  static async makeLabelUrl(label: ExportedLabelTemplate): Promise<string> {
    const labelStr = JSON.stringify({ ...label, thumbnailBase64: undefined });

    const encoder = new TextEncoder();
    const data = encoder.encode(labelStr);

    if (data.length > (2 * 1024 * 1024)) {
      throw new Error("Label data size > 2MB");
    }

    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    writer.write(data);
    writer.close();

    const compressed = new Uint8Array(await new Response(cs.readable).arrayBuffer());
    const arr = new Uint8Array(compressed);
    const binString = String.fromCodePoint(...arr);
    const baseUrl = location.protocol + "//" + location.host;
    const b64data = btoa(binString);

    return `${baseUrl}/#load=${b64data}`;
  }

  static urlHashParamsToDict(): Record<string, string> {
    const anchorData = globalThis.location.hash.slice(1);

    if (!anchorData) {
      return {};
    }

    return anchorData.split("&").reduce((res: Record<string, string>, item: string) => {
      const firstEqualsIndex = item.indexOf("=");

      if (firstEqualsIndex === -1) {
        // Handle case without value (e.g., "key" without "=value")
        res[item] = "";
      } else {
        const key = item.slice(0, firstEqualsIndex);
        const value = item.slice(firstEqualsIndex + 1);
        res[key] = value;
      }

      return res;
    }, {});
  }

  static async readLabelFromUrl(): Promise<ExportedLabelTemplate | null> {
    const params = FileUtils.urlHashParamsToDict();

    if ("uload" in params) {
      const b64data: string = params["uload"];
      const jsonBytes = this.base64toBytes(b64data);
      const jsonStr = new TextDecoder().decode(jsonBytes);
      const labelObj = JSON.parse(jsonStr);
      return ExportedLabelTemplateSchema.parse(labelObj);
    }

    if (!("load" in params)) {
      return null;
    }

    const b64data: string = params["load"];
    const bytes = this.base64toBytes(b64data);

    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();

    const decompressed = await new Response(ds.readable).arrayBuffer();
    const decoder = new TextDecoder();

    const decoded = decoder.decode(decompressed);
    const labelObj = JSON.parse(decoded);
    return ExportedLabelTemplateSchema.parse(labelObj);
  }
}
