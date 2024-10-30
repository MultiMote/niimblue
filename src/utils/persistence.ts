import {
  ExportedLabelTemplateSchema,
  FabricJsonSchema,
  LabelPresetSchema,
  LabelPropsSchema,
  PreviewPropsSchema,
  type ConnectionType,
  type ExportedLabelTemplate,
  type LabelPreset,
  type LabelProps,
  type PreviewProps,
} from "../types";
import { z } from "zod";
import { FileUtils } from "./file_utils";

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

  static saveLabels(labels: ExportedLabelTemplate[]): z.ZodError[] {
    const errors: z.ZodError[] = [];
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("saved_label")) {
        localStorage.removeItem(key);
      }
    });

    labels.forEach((label) => {
      try {
        if (label.timestamp == undefined) {
          label.timestamp = FileUtils.timestamp();
        }

        const basename = `saved_label_${label.timestamp}`;
        let counter = 0;

        while (`${basename}_${counter}` in localStorage) {
          counter++;
        }

        this.validateAndSaveObject(`${basename}_${counter}`, label, ExportedLabelTemplateSchema);
      } catch (e) {
        console.error(e);
        if (e instanceof z.ZodError) {
          errors.push(e);
        }
      }
    });
    return errors;
  }

  /**
   * @throws {z.ZodError}
   */
  static loadLabels(): ExportedLabelTemplate[] {
    const legacyLabel = this.loadAndValidateObject("saved_canvas_props", LabelPropsSchema);
    const legacyCanvas = this.loadAndValidateObject("saved_canvas_data", FabricJsonSchema);
    const items: ExportedLabelTemplate[] = [];

    if (legacyLabel !== null && legacyCanvas !== null) {
      localStorage.removeItem("saved_canvas_props");
      localStorage.removeItem("saved_canvas_data");
      const item: ExportedLabelTemplate = {
        label: legacyLabel,
        canvas: legacyCanvas,
        timestamp: FileUtils.timestamp(),
      };
      this.validateAndSaveObject(`saved_label_${item.timestamp}`, item, ExportedLabelTemplateSchema);
    }

    Object.keys(localStorage).sort().forEach((key) => {
      if (key.startsWith("saved_label")) {
        try {
          const item = this.loadAndValidateObject(key, ExportedLabelTemplateSchema);
          if (item != null) {
            items.push(item);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    return items;
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

  static loadLastConnectionType(): ConnectionType | null {
    const value = localStorage.getItem("connection_type");
    if (value === null || !["bluetooth", "serial"].includes(value)) {
      return null;
    }
    return value as ConnectionType;
  }

  static saveLastConnectionType(value: ConnectionType) {
    localStorage.setItem("connection_type", value);
  }
}
