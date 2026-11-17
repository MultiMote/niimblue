import { PrintDirection, ResolutionClass, type PrinterInfo, type PrinterModelMeta } from "@mmote/niimbluelib";
import { z } from "zod";
import { InputAreaSchema, LabelUnit, StandardDpi, type LabelProps } from "$/types";

const CLOUD_LABEL_ENDPOINTS = [
  "https://print.niimbot.com/api/template/getCloudTemplateByOneCode",
  "https://rfid.niim.blue/barcodeInfo",
];

const CLOUD_LABEL_TIMEOUT_MS = 5000;

const NiimbotCloudResponse = z.object({
  data: z
    .object({
      name: z.string().optional(),
      width: z.number().positive(),
      height: z.number().positive(),
      rotate: z.number().nonnegative(),
      cableDirection: z.number(),
      cableLength: z.number(),
      isCable: z.boolean(),
      canvasRotate: z.number().nonnegative().default(0),
      paperType: z.number().nonnegative(),
      inputAreas: z.array(InputAreaSchema).default([]),
      labelNames: z.array(
        z.object({
          name: z.string(),
          languageCode: z.string(),
        }),
      ),
    })
    .optional(),
});

export class LabelPropsUtils {
  static getPrintheadSize(printerInfo?: PrinterInfo, printerMeta?: PrinterModelMeta): number {
    if (printerInfo?.printheadWidth !== undefined) {
      return printerInfo.printheadWidth;
    }
    return printerMeta?.printheadPixels ?? -1;
  }

  static getDpi(printerInfo?: PrinterInfo, printerMeta?: PrinterModelMeta): StandardDpi {
    if (printerInfo?.resolutionClass !== undefined) {
      return printerInfo.resolutionClass === ResolutionClass.DPI300 ? 300 : 203;
    }

    if (printerInfo?.capabilities?.printheadDpi !== undefined) {
      return printerInfo.capabilities.printheadDpi === 300 ? 300 : 203;
    }

    return printerMeta?.dpi === 300 ? 300 : 203;
  }

  static unitToPx(value: number, unit: LabelUnit, dpmm: number): number {
    return Math.floor(value * (unit === "mm" ? dpmm : 1));
  }

  static sizeToPx(labelProps: LabelProps): { width: number; height: number } {
    const width = this.unitToPx(labelProps.width, labelProps.unit, labelProps.dpmm);
    const height = this.unitToPx(labelProps.height, labelProps.unit, labelProps.dpmm);

    return { width: Math.max(width, 1), height: Math.max(height, 1) };
  }

  static tailLengthToPx(labelProps: LabelProps): number {
    return this.unitToPx(labelProps.tailLength ?? 0, labelProps.unit, labelProps.dpmm);
  }

  static async createFromCloud(barcode: string, dpmm: number) {
    let lastError: Error = new Error(`No info for barcode ${barcode}`);

    for (const endpoint of CLOUD_LABEL_ENDPOINTS) {
      try {
        return await this.fetchCloudPreset(endpoint, barcode, dpmm);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError;
  }

  private static async fetchCloudPreset(endpoint: string, barcode: string, dpmm: number): Promise<LabelProps> {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "niimbot-user-agent": "AppVersionName/999.0.0",
      },
      body: JSON.stringify({ oneCode: barcode }),
      signal: AbortSignal.timeout(CLOUD_LABEL_TIMEOUT_MS),
    });

    if (!resp.ok) {
      throw new Error(`Server ${endpoint} returned HTTP ${resp.status}`);
    }

    const body = await resp.json();
    const parsed = await NiimbotCloudResponse.parseAsync(body);

    if (parsed.data === undefined) {
      throw new Error(`No info for barcode ${barcode} on ${endpoint}`);
    }

    const title = parsed.data.labelNames.find((o) => o.languageCode === "en")?.name || parsed.data.name || "";
    let printDirection: PrintDirection = parsed.data.rotate % 180 == 90 ? "left" : "top";
    const canvasRotate = parsed.data.canvasRotate % 180 == 90;
    let width = parsed.data.width;
    let height = parsed.data.height;

    if (canvasRotate) {
      printDirection = printDirection === "top" ? "left" : "top";
      width = parsed.data.height;
      height = parsed.data.width;
    }

    const preset: LabelProps = {
      barcode,
      labelType: parsed.data.paperType,
      width,
      height,
      unit: "mm",
      dpmm,
      inputAreas: parsed.data.inputAreas,
      printDirection,
      title,
      shape: "rounded_rect",
    };

    if (parsed.data.isCable) {
      // what else exist?
      if (parsed.data.cableDirection === 1 && preset.printDirection === "left") {
        preset.width += parsed.data.cableLength;
        preset.tailLength = parsed.data.cableLength;
        preset.split = "vertical";
        preset.splitParts = 2;
        preset.tailPos = "right";
      }
    }

    return preset;
  }
}
