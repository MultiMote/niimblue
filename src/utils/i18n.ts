import { derived, writable } from "svelte/store";
import type { TranslationKey, SupportedLanguage } from "../locale";
import { languageNames, langPack } from "../locale";
import { match as langMatch } from "@formatjs/intl-localematcher";

/** Check browser language and return supported language code.
 *  If language is not supported, "en" is returned. */
const guessBrowserLanguage = (): SupportedLanguage => {
  const fallback: SupportedLanguage = "en";
  const browserLang = navigator.language;
  const supportedLangs = Object.keys(langPack).map(e => e.replaceAll("_", "-"));

  try {
    const nearestLang = langMatch([browserLang], supportedLangs, fallback);
    return nearestLang.replaceAll("-", "_") as SupportedLanguage;
  } catch (e) {
    console.warn("Unable to detect language:", e);
    return fallback;
  }
};

export const locale = writable<SupportedLanguage>(
  (localStorage.getItem("locale") as SupportedLanguage) ?? guessBrowserLanguage()
);

locale.subscribe((value: SupportedLanguage) => localStorage.setItem("locale", value));

export const tr = derived(locale, ($locale) => (key: TranslationKey) => {
  const result = langPack[$locale] ? langPack[$locale][key] : undefined;
  if (result === undefined || result === "") {
    if ($locale !== "en") {
      console.warn(`${key} of ${$locale} locale is not translated`);
    }
    return langPack.en[key];
  }
  return result;
});

export const locales = languageNames;
export type { TranslationKey, SupportedLanguage } from "../locale";
