import type en from "./dicts/en.json";

export type TranslationKey = keyof typeof en;
export type TranslationDict = Partial<Record<TranslationKey, string>>;

export const languageNames = {
  /** English (fallback) */
  en: "English",
  /** Czech */
  cs: "Čeština",
  /** German */
  de: "Deutsch",
  /** Italian */
  it: "Italiano",
  /** Russian */
  ru: "Русский",
  /** Polish */
  pl: "Polski",
  /** Simplified Chinese */
  zh_cn: "简体中文",
  /** Traditional Chinese */
  zh_tw: "繁體中文",
  /** French */
  fr: "Français",
  /** Portuguese (Brazil) */
  pt_br: "Português (Brasil)",
  /** Croatian */
  hr: "Hrvatski",
  /** Korean */
  ko_kr: "한국어",
  /** Spanish */
  es: "Español",
  /** Arabic */
  ar: "العربية",
  /** Hungarian */
  hu: "Magyar",
  /** Turkish */
  tr: "Türkçe",
  /** Hindi */
  hi: "हिंदी",
  /** Marathi */
  mr: "मराठी",
  /** Bulgarian */
  bg: "Български",
  /** Swedish */
  sv: "Svenska",
  /** Ukrainian */
  uk: "Українська",
} as const;

export type SupportedLanguage = keyof typeof languageNames;

const langLoaders: Record<SupportedLanguage, () => Promise<{ default: TranslationDict }>> = {
  en: () => import("./dicts/en.json"),
  cs: () => import("./dicts/cs.json"),
  de: () => import("./dicts/de.json"),
  it: () => import("./dicts/it.json"),
  ru: () => import("./dicts/ru.json"),
  pl: () => import("./dicts/pl.json"),
  zh_cn: () => import("./dicts/zh_cn.json"),
  zh_tw: () => import("./dicts/zh_tw.json"),
  fr: () => import("./dicts/fr.json"),
  pt_br: () => import("./dicts/pt_BR.json"),
  hr: () => import("./dicts/hr.json"),
  ko_kr: () => import("./dicts/ko_KR.json"),
  es: () => import("./dicts/es.json"),
  ar: () => import("./dicts/ar.json"),
  hu: () => import("./dicts/hu.json"),
  tr: () => import("./dicts/tr.json"),
  hi: () => import("./dicts/hi.json"),
  mr: () => import("./dicts/mr.json"),
  bg: () => import("./dicts/bg.json"),
  sv: () => import("./dicts/sv.json"),
  uk: () => import("./dicts/uk.json"),
};

const dictPromises = new Map<SupportedLanguage, Promise<TranslationDict>>();

export const loadTranslationDict = (lang: SupportedLanguage): Promise<TranslationDict> => {
  const cached = dictPromises.get(lang);
  if (cached !== undefined) {
    return cached;
  }

  const promise = langLoaders[lang]()
    .then((module) => module.default)
    .catch((e: unknown) => {
      dictPromises.delete(lang); // allow retrying later
      throw e;
    });
  dictPromises.set(lang, promise);
  return promise;
};
