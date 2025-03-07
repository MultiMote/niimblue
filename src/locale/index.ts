import lang_cs from "./dicts/cs.json";
import lang_de from "./dicts/de.json";
import lang_en from "./dicts/en.json";
import lang_it from "./dicts/it.json";
import lang_ru from "./dicts/ru.json";
import lang_pl from "./dicts/pl.json";
import lang_zh_cn from "./dicts/zh_cn.json";

export type TranslationKey = keyof typeof lang_en;
export type TranslationDict = Record<TranslationKey, string>;

export const langPack = {
  /** English (fallback) */
  en: lang_en,
  /** Czech */
  cs: lang_cs as TranslationDict,
  /** Italian */
  de: lang_de as TranslationDict,
  /** Italian */
  it: lang_it as TranslationDict,
  /** Russian */
  ru: lang_ru as TranslationDict,
  /** Polish */
  pl: lang_pl as TranslationDict,
  /** Simplified Chinese */
  zh_cn: lang_zh_cn as TranslationDict,
} as const;

export type SupportedLanguage = keyof typeof langPack;

export const languageNames = Object.assign(
  {},
  ...Object.entries(langPack).map(([k, v]) => ({
    [k]: v["lang.name"] ?? k,
  }))
) as Record<SupportedLanguage, string>;
