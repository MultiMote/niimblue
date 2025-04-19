import { derived, writable } from "svelte/store";
import type { TranslationKey, SupportedLanguage } from "../locale";
import { languageNames, langPack } from "../locale";

/** Check browser language and return supported language code.
 *  If language is not supported, "en" is returned. */
const guessBrowserLanguage = (): SupportedLanguage => {
  switch (navigator.language) {
    case "cs":
    case "cs-CZ":
      return "cs";
    case "de":
    case "de-AT":
    case "de-CH":
    case "de-DE":
    case "de-LI":
    case "de-LU":
      return "de";
    case "it":
    case "it-CH":
    case "it-IT":
      return "it";
    case "ru":
    case "ru-RU":
      return "ru";
    case "pl":
    case "pl-PL":
      return "pl";
    case "zh":
    case "zh-Hans":
    case "zh-CN":
      return "zh_cn";
    case "fr":
      case "fr-FR":
        return "fr";
    default:
      return "en";
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
