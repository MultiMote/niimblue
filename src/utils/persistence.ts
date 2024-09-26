import type { FabricJson, LabelPreset, LabelProps, PreviewProps } from "../types";

// todo: validation
export class Persistence {
  static saveObject(key: string, data: any) {
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

  static loadLastLabelProps(): LabelProps | null {
    const obj = this.loadObject("last_label_props");

    if (obj != null) {
      if ("size" in obj && "width" in obj.size && "height" in obj.size && ["top", "left"].includes(obj.printDirection)) {
        return obj as LabelProps;
      }
    }
    return null;
  }

  static saveLastLabelProps(labelData: LabelProps) {
    this.saveObject("last_label_props", labelData);
  }

  static saveCanvas(labelData: LabelProps, canvasData: FabricJson) {
    this.saveObject("saved_canvas_props", labelData);
    this.saveObject("saved_canvas_data", canvasData);
  }

  static loadSavedCanvas(): { labelData: LabelProps | null; canvasData: FabricJson | null } {
    const labelData = this.loadObject("saved_canvas_props");
    const canvasData = this.loadObject("saved_canvas_data");
    return { labelData, canvasData };
  }

  static savePreviewProps(props: PreviewProps)  {
    this.saveObject("saved_preview_props", props);
  }

  static loadSavedPreviewProps(): PreviewProps {
    return this.loadObject("saved_preview_props") as PreviewProps;
  }

  static saveLabelPresets(presets: LabelPreset[])  {
    this.saveObject("label_presets", presets);
  }

  static loadLabelPresets(): LabelPreset[] {
    return this.loadObject("label_presets") as LabelPreset[];
  }
}
