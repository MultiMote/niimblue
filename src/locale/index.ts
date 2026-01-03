import lang_cs from "$/locale/dicts/cs.json";
import lang_de from "$/locale/dicts/de.json";
import lang_en from "$/locale/dicts/en.json";
import lang_it from "$/locale/dicts/it.json";
import lang_ru from "$/locale/dicts/ru.json";
import lang_pl from "$/locale/dicts/pl.json";
import lang_zh_cn from "$/locale/dicts/zh_cn.json";
import lang_zh_tw from "$/locale/dicts/zh_tw.json";
import lang_fr from "$/locale/dicts/fr.json";
import lang_pt_br from "$/locale/dicts/pt_BR.json";
import lang_hr from "$/locale/dicts/hr.json";
import lang_ko_kr from "$/locale/dicts/ko_KR.json";
import lang_es from "$/locale/dicts/es.json";
import lang_ar from "$/locale/dicts/ar.json";
import lang_hu from "$/locale/dicts/hu.json";
import lang_tr from "$/locale/dicts/tr.json";

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
  /** Turkish */
  tr: lang_tr as TranslationDict,
} as const;

export type SupportedLanguage = keyof typeof langPack;

export const languageNames = Object.assign(
  {},
  ...Object.entries(langPack).map(([k, v]) => ({
    [k]: v["lang.name"] ?? k,
  })),
) as Record<SupportedLanguage, string>;
