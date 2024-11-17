import { translation_de } from "./de";
import { translation_en } from "./en";
import { translation_de } from "./it";
import { translation_ru } from "./ru";
import { translation_zh_cn } from "./zh_cn";

export const langPack = {
  /** German */
  de: translation_de,
  /** English (fallback) */
  en: translation_en,
  /** Italian */
  it: translation_it,
  /** Russian */
  ru: translation_ru,
  /** Simplified Chinese */
  zh_cn: translation_zh_cn,
} as const;

export type TranslationKey = keyof typeof translation_en;
export type SupportedLanguage = keyof typeof langPack;

export const languageNames: Record<SupportedLanguage, string> = {
  de: "Deutsch",
  en: "English",
  it: "Italiano",
  ru: "Русский",
  zh_cn: "简体中文",
};
