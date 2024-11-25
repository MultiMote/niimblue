import lang_de from "./dicts/de.json";
import lang_en from "./dicts/en.json";
import lang_it from "./dicts/it.json";
import lang_ru from "./dicts/ru.json";
import lang_zh_cn from "./dicts/zh_cn.json";

export type TranslationKey = keyof typeof lang_en;
export type TranslationDict = Record<TranslationKey, string>;

export const langPack = {
  /** English (fallback) */
  en: lang_en,
  /** German */
  de: lang_de as TranslationDict,
  /** Italian */
  it: lang_it as TranslationDict,
  /** Russian */
  ru: lang_ru as TranslationDict,
  /** Simplified Chinese */
  zh_cn: lang_zh_cn as TranslationDict,
} as const;

export type SupportedLanguage = keyof typeof langPack;

export const languageNames: Record<SupportedLanguage, string> = {
  de: "Deutsch",
  en: "English",
  it: "Italiano",
  ru: "Русский",
  zh_cn: "简体中文",
};
