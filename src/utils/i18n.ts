import { derived, get, writable } from "svelte/store";
import { match as langMatch } from "@formatjs/intl-localematcher";
import { languageNames, loadTranslationDict } from "$/locale";
import type { SupportedLanguage, TranslationDict, TranslationKey } from "$/locale";

const fallbackLanguage: SupportedLanguage = "en";

/** Guess supported language code from browser settings.
 *  If language is not supported, "en" is returned. */
const guessBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language;
  const supportedLangs = Object.keys(languageNames).map((e) => e.replaceAll("_", "-"));

  try {
    const nearestLang = langMatch([browserLang], supportedLangs, fallbackLanguage);
    return nearestLang.replaceAll("-", "_") as SupportedLanguage;
  } catch (e) {
    console.warn("Unable to detect language:", e);
    return fallbackLanguage;
  }
};

export const locale = writable<SupportedLanguage>(
  (localStorage.getItem("locale") as SupportedLanguage) ?? guessBrowserLanguage(),
);

const loadedDicts = writable<Partial<Record<SupportedLanguage, TranslationDict>>>({});

const ensureDictLoaded = (lang: SupportedLanguage): Promise<TranslationDict> =>
  loadTranslationDict(lang).then((dict) => {
    loadedDicts.update((dicts) => (dicts[lang] === dict ? dicts : { ...dicts, [lang]: dict }));
    return dict;
  });

locale.subscribe((value: SupportedLanguage) => {
  localStorage.setItem("locale", value);
  ensureDictLoaded(value).catch((e: unknown) => console.error(`Unable to load ${value} locale:`, e));
});

export const initI18n = (): Promise<void> =>
  Promise.all([ensureDictLoaded(fallbackLanguage), ensureDictLoaded(get(locale))]).then(() => {});

export const tr = derived([locale, loadedDicts], ([$locale, $dicts]) => {
  const dict = $dicts[$locale];
  const fallbackDict = $dicts[fallbackLanguage];

  return (key: TranslationKey): string => {
    const result = dict?.[key];
    if (result) {
      return result;
    }
    if (dict !== undefined && $locale !== fallbackLanguage) {
      console.warn(`${key} of ${$locale} locale is not translated`);
    }
    return fallbackDict?.[key] ?? key;
  };
});

export const locales = languageNames;
export type { TranslationKey, SupportedLanguage, TranslationDict } from "$/locale";
