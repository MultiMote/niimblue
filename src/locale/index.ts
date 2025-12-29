import lang_cs from "./dicts/cs.json";
import lang_de from "./dicts/de.json";
import lang_en from "./dicts/en.json";
import lang_it from "./dicts/it.json";
import lang_ru from "./dicts/ru.json";
import lang_pl from "./dicts/pl.json";
import lang_zh_cn from "./dicts/zh_cn.json";
import lang_zh_tw from "./dicts/zh_tw.json";
import lang_fr from "./dicts/fr.json";
import lang_pt_br from "./dicts/pt_BR.json";
import lang_hr from "./dicts/hr.json";
import lang_ko_kr from "./dicts/ko_KR.json";
import lang_es from "./dicts/es.json";
import lang_ar from "./dicts/ar.json";
import lang_hu from "./dicts/hu.json";

export type TranslationKey = keyof typeof lang_en;
export type TranslationDict = Record<TranslationKey, string>;

export const langPack = {
  /** English (fallback) */
  en: lang_en,
  /** Czech */
  cs: lang_cs as TranslationDict,
  /** German */
  de: lang_de as TranslationDict,
  /** Italian */
  it: lang_it as TranslationDict,
  /** Russian */
  ru: lang_ru as TranslationDict,
  /** Polish */
  pl: lang_pl as TranslationDict,
  /** Simplified Chinese */
  zh_cn: lang_zh_cn as TranslationDict,
  /** Traditional Chinese */
  zh_tw: lang_zh_tw as TranslationDict,
  /** French */
  fr: lang_fr as TranslationDict,
  /** Portuguese (Brazil) */
  pt_br: lang_pt_br as TranslationDict,
  /** Croatian */
  hr: lang_hr as TranslationDict,
  /** Korean */
  ko_kr: lang_ko_kr as TranslationDict,
  /** Spanish */
  es: lang_es as TranslationDict,
  /** Arabic */
  ar: lang_ar as TranslationDict,
  /** Hungarian */
  hu: lang_hu as TranslationDict,
} as const;

export type SupportedLanguage = keyof typeof langPack;

export const languageNames = Object.assign(
  {},
  ...Object.entries(langPack).map(([k, v]) => ({
    [k]: v["lang.name"] ?? k
  }))
) as Record<SupportedLanguage, string>;
