import { derived, writable } from "svelte/store";
import type { translationKeys, supportedLanguages } from "../locale"
import { languageNames, langPack } from "../locale";

export type {translationKeys, supportedLanguages} from '../locale'

function browserLanguage2supportedLanguage(browserLanguage: string): supportedLanguages {
  switch(browserLanguage) {
    case "ru":
    case "ru-RU":
      return "ru"
    case "zh":
    case "zh-Hans":
    case "zh-CN":
      return "zh_cn";
    default:
      return "en"
  }
}

export const locales = languageNames;

export const locale = writable<supportedLanguages>(
  localStorage.getItem("locale") as supportedLanguages ?? browserLanguage2supportedLanguage(navigator.language)
);
locale.subscribe((value: supportedLanguages) => localStorage.setItem("locale", value));

export const tr = derived(locale, ($locale) => (key: translationKeys, fallback: string) => {
  const result = langPack[$locale] ? langPack[$locale][key] : undefined;
  if (result === undefined) {
    if ($locale !== "en") {
      console.warn(`${key} of ${$locale} locale is not translated`);
    }
    return fallback;
  }
  return result;
});
