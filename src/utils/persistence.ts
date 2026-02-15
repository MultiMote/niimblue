import {
  AutomationPropsSchema,
  ExportedLabelTemplateSchema,
  FabricJsonSchema,
  LabelPresetSchema,
  LabelPropsSchema,
  PreviewPropsSchema,
  type AutomationProps,
  type ConnectionType,
  type ExportedLabelTemplate,
  type LabelPreset,
  type LabelProps,
  type PreviewProps,
} from "$/types";
import { z } from "zod";
import { FileUtils } from "$/utils/file_utils";
import { get, writable, type Updater, type Writable } from "svelte/store";

/** Writable store, value is persisted to localStorage */
export function writablePersisted<T>(
  key: string,
  schema: z.ZodType<T>,
  initialValue: T,
): Writable<T> {
  const wr = writable<T>(initialValue);

  try {
    const val = LocalStoragePersistence.loadAndValidateObject(key, schema);
    if (val === null) {
      wr.set(initialValue);
    } else {
      wr.set(val);
    }
  } catch {
    wr.set(initialValue);
  }

  return {
    subscribe: wr.subscribe,

    set: (value: T) => {
      LocalStoragePersistence.validateAndSaveObject(key, value, schema);
      wr.set(value);
    },

    update: (updater: Updater<T>) => {
      const newValue: T = updater(get(wr));
      LocalStoragePersistence.validateAndSaveObject(key, newValue, schema);
      wr.set(newValue);
    },
  };
}

export class LocalStoragePersistence {
  /** Result in kilobytes */
  static usedSpace(): number {
    let total = 0;
    Object.keys(localStorage).forEach((key) => {
      total += (localStorage[key].length + key.length) * 2;
    });
    return Math.floor(total / 1024);
  }

  static saveObject(key: string, data: any) {
    if (data === null || data === undefined) {
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

  static validateAndSaveObject<T>(
    key: string,
    data: any,
    schema: z.ZodType<T>,
  ): void {
    if (data === null || data === undefined) {
      this.saveObject(key, data);
      return;
    }

    const obj = schema.parse(data);
    this.saveObject(key, obj);
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

  static createUidForLabel(label: ExportedLabelTemplate): string {
    const basename = `saved_label_${label.timestamp}`;
    let counter = 0;

    while (`${basename}_${counter}` in localStorage) {
      counter++;
    }

    return `${basename}_${counter}`;
  }

  static saveLabels(labels: ExportedLabelTemplate[]): {
    zodErrors: z.ZodError[];
    otherErrors: Error[];
  } {
    const zodErrors: z.ZodError[] = [];
    const otherErrors: Error[] = [];

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("saved_label")) {
        localStorage.removeItem(key);
      }
    });

    labels.forEach((label) => {
      try {
        if (label.timestamp === undefined) {
          label.timestamp = FileUtils.timestamp();
        }

        const basename = `saved_label_${label.timestamp}`;
        let counter = 0;

        while (`${basename}_${counter}` in localStorage) {
          counter++;
        }

        this.validateAndSaveObject(
          this.createUidForLabel(label),
          label,
          ExportedLabelTemplateSchema.omit({ id: true }),
        );
      } catch (e) {
        if (e instanceof z.ZodError) {
          zodErrors.push(e);
        }
        if (e instanceof Error) {
          otherErrors.push(e);
        }
      }
    });
    return { zodErrors, otherErrors };
  }

  /**
   * @throws {z.ZodError}
   */
  static loadLabels(): ExportedLabelTemplate[] {
    const legacyLabel = this.loadAndValidateObject(
      "saved_canvas_props",
      LabelPropsSchema,
    );
    const legacyCanvas = this.loadAndValidateObject(
      "saved_canvas_data",
      FabricJsonSchema,
    );
    const items: ExportedLabelTemplate[] = [];

    if (legacyLabel !== null && legacyCanvas !== null) {
      localStorage.removeItem("saved_canvas_props");
      localStorage.removeItem("saved_canvas_data");
      const item: ExportedLabelTemplate = {
        label: legacyLabel,
        canvas: legacyCanvas,
        timestamp: FileUtils.timestamp(),
      };
      this.validateAndSaveObject(
        `saved_label_${item.timestamp}`,
        item,
        ExportedLabelTemplateSchema,
      );
    }

    Object.keys(localStorage)
      .sort()
      .forEach((key) => {
        if (key.startsWith("saved_label")) {
          try {
            const item = this.loadAndValidateObject(
              key,
              ExportedLabelTemplateSchema,
            );
            if (item != null) {
              item.id = key;
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
    this.validateAndSaveObject(
      "saved_preview_props",
      props,
      PreviewPropsSchema,
    );
  }

  /**
   * @throws {z.ZodError}
   */
  static loadSavedPreviewProps(): PreviewProps | null {
    return this.loadAndValidateObject(
      "saved_preview_props",
      PreviewPropsSchema,
    );
  }

  /**
   * @throws {z.ZodError}
   */
  static saveLabelPresets(presets: LabelPreset[]) {
    this.validateAndSaveObject(
      "label_presets",
      presets,
      z.array(LabelPresetSchema),
    );
  }

  /**
   * @throws {z.ZodError}
   */
  static loadLabelPresets(): LabelPreset[] | null {
    const presets = this.loadAndValidateObject(
      "label_presets",
      z.array(LabelPresetSchema),
    );
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

  /**
   * @throws {z.ZodError}
   */
  static saveAutomation(value?: AutomationProps) {
    this.validateAndSaveObject("automation", value, AutomationPropsSchema);
  }

  /**
   * @throws {z.ZodError}
   */
  static loadAutomation(): AutomationProps | null {
    return this.loadAndValidateObject("automation", AutomationPropsSchema);
  }

  /**
   * @throws {z.ZodError}
   */
  static saveDefaultTemplate(value?: ExportedLabelTemplate) {
    this.validateAndSaveObject(
      "default_template",
      value,
      ExportedLabelTemplateSchema.omit({ id: true }),
    );
  }

  /**
   * @throws {z.ZodError}
   */
  static loadDefaultTemplate(): ExportedLabelTemplate | null {
    return this.loadAndValidateObject(
      "default_template",
      ExportedLabelTemplateSchema,
    );
  }

  static hasCustomDefaultTemplate(): boolean {
    return "default_template" in localStorage;
  }

  /**
   * @throws {z.ZodError}
   */
  static saveCachedFonts(fonts: string[]) {
    this.validateAndSaveObject("font_cache", fonts, z.array(z.string()));
  }

  /**
   * @throws {z.ZodError}
   */
  static loadCachedFonts(): string[] {
    return this.loadAndValidateObject("font_cache", z.array(z.string())) ?? [];
  }
}
