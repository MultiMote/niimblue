import { translation_ru } from "./ru";
import { translation_zh_cn } from "./zh_cn";

export type translationKeys =
  | "browser_warning.lines.first"
  | "browser_warning.lines.second"
  | "connector.bluetooth"
  | "connector.serial"
  | "editor.clone"
  | "editor.default_text"
  | "editor.delete"
  | "editor.export.json"
  | "editor.iconpicker.search"
  | "editor.iconpicker.title"
  | "editor.import.json"
  | "editor.import.zpl"
  | "editor.objectpicker.barcode"
  | "editor.objectpicker.circle"
  | "editor.objectpicker.image"
  | "editor.objectpicker.line"
  | "editor.objectpicker.qrcode"
  | "editor.objectpicker.rectangle"
  | "editor.objectpicker.text"
  | "editor.objectpicker.title"
  | "editor.preview"
  | "editor.print"
  | "editor.warning.save"
  | "editor.warning.load"
  | "main.built"
  | "main.code"
  | "params.csv.title"
  | "params.csv.tip"
  | "params.csv.rowsfound"
  | "params.csv.enabled"
  | "params.csv.placeholders"
  | "params.barcode.content"
  | "params.barcode.encoding"
  | "params.barcode.scale"
  | "params.barcode.font_size"
  | "params.barcode.enable_caption"
  | "params.generic.center.horizontal"
  | "params.generic.center.vertical"
  | "params.label.calc"
  | "params.label.direction.left"
  | "params.label.direction.top"
  | "params.label.direction"
  | "params.label.dpmm"
  | "params.label.mm"
  | "params.label.px"
  | "params.label.size"
  | "params.label.title"
  | "params.qrcode.ecl"
  | "params.text.align.center"
  | "params.text.align.left"
  | "params.text.align.right"
  | "params.text.vorigin"
  | "params.text.vorigin.top"
  | "params.text.vorigin.center"
  | "params.text.vorigin.bottom"
  | "params.text.bold"
  | "params.text.invert_colors"
  | "params.text.fetch_fonts"
  | "params.text.font_family"
  | "params.text.font_size.down"
  | "params.text.font_size.up"
  | "params.text.font_size"
  | "params.text.line_height"
  | "params.variables.insert"
  | "params.variables.insert.datetime"
  | "params.variables.insert.date"
  | "params.variables.insert.time"
  | "preview.close"
  | "preview.copies"
  | "preview.density"
  | "preview.label_type.Black"
  | "preview.label_type.BlackMarkGap"
  | "preview.label_type.Continuous"
  | "preview.label_type.HeatShrinkTube"
  | "preview.label_type.Invalid"
  | "preview.label_type.Perforated"
  | "preview.label_type.PvcTag"
  | "preview.label_type.Transparent"
  | "preview.label_type.WithGaps"
  | "preview.label_type"
  | "preview.not_connected"
  | "preview.not_implemented"
  | "preview.postprocess.atkinson"
  | "preview.postprocess.threshold"
  | "preview.postprocess"
  | "preview.print_task_version"
  | "preview.print"
  | "preview.threshold"
  | "preview.title";

export type supportedLanguages = "en" | "ru" | "zh_cn";

export const langPack: Record<supportedLanguages, Partial<Record<translationKeys, string>>> = {
  /** Do not add anything in "en" translation, fallback values are used */
  en: {},
  /** Russian */
  ru: translation_ru,
  /** Simplified Chinese */
  zh_cn: translation_zh_cn,
};

export const languageNames: Record<supportedLanguages, string> = {
  en: "English",
  ru: "Русский",
  zh_cn: "简体中文",
};