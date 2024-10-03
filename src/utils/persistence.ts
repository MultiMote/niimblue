import { FabricJsonSchema, LabelPresetSchema, LabelPropsSchema, PreviewPropsSchema, type FabricJson, type LabelPreset, type LabelProps, type PreviewProps } from "../types";
import { z } from "zod";

export class LocalStoragePersistence {
  static saveObject(key: string, data: any) {
    if (data == null || data == undefined) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(data));
  }
  static loadObject(key: string): any {
    const data = localStorage.getItem(key);
    if (data !== null) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.log(e);
      }
    }
    return null;
  }

  /**
   * @throws {z.ZodError}
   */
  static loadAndValidateObject<T>(key: string, schema: z.ZodType<T>) {
    const data = this.loadObject(key);

    if (data === null) {
      return null;
    }

    return schema.parse(data);
  }

  static validateAndSaveObject<T>(key: string, data: any, schema: z.ZodType<T>): void {
    if (data === null || data === undefined) {
      this.saveObject(key, data);
      return;
    }

    const obj = schema.parse(data);
    this.saveObject(key, obj);
  }

  static saveCsv(data: string) {
    this.saveObject("csv_params", { data });
  }

  static loadCsv(): { data: string } {
    const result = this.loadObject("csv_params");

    if (result === null) {
      return {
        data: "var1,var2\n123,456\n777,888",
      };
    }

    return {
      data: result.data,
    };
  }

  /**
   * @throws {z.ZodError}
   */
  static loadLastLabelProps(): LabelProps | null {
    return this.loadAndValidateObject("last_label_props", LabelPropsSchema);
  }

  /**
   * @throws {z.ZodError}
   */
  static saveLastLabelProps(labelData: LabelProps) {
    this.validateAndSaveObject("last_label_props", labelData, LabelPropsSchema);
  }

  /**
   * @throws {z.ZodError}
   */
  static saveCanvas(labelData: LabelProps, canvasData: FabricJson) {
    this.validateAndSaveObject("saved_canvas_props", labelData, LabelPropsSchema);
    this.validateAndSaveObject("saved_canvas_data", canvasData, FabricJsonSchema);
  }

  /**
   * @throws {z.ZodError}
   */
  static loadSavedCanvas(): { labelData: LabelProps | null; canvasData: FabricJson | null } {
    const labelData = this.loadAndValidateObject("saved_canvas_props", LabelPropsSchema);
    const canvasData = this.loadAndValidateObject("saved_canvas_data", FabricJsonSchema);
    return { labelData, canvasData };
  }

  /**
   * @throws {z.ZodError}
   */
  static savePreviewProps(props: PreviewProps) {
    this.validateAndSaveObject("saved_preview_props", props, PreviewPropsSchema);
  }

  /**
   * @throws {z.ZodError}
   */
  static loadSavedPreviewProps(): PreviewProps | null {
    return this.loadAndValidateObject("saved_preview_props", PreviewPropsSchema);
  }

  /**
   * @throws {z.ZodError}
   */
  static saveLabelPresets(presets: LabelPreset[]) {
    this.validateAndSaveObject("label_presets", presets, z.array(LabelPresetSchema));
  }

  /**
   * @throws {z.ZodError}
   */
  static loadLabelPresets(): LabelPreset[] | null {
    const presets = this.loadAndValidateObject("label_presets", z.array(LabelPresetSchema));
    return presets === null || presets.length === 0 ? null : presets;
  }
}
