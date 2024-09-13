import { derived, writable } from "svelte/store";
import type {translationKeys, supportedLanguagesKeys} from "../lang_pack"
import { supportedLanguages ,langPack } from "../lang_pack";

export const locales = supportedLanguages;

export const locale = writable<supportedLanguagesKeys>(
  localStorage.getItem("locale") as supportedLanguagesKeys ?? "en"
);
locale.subscribe((value: string) => localStorage.setItem("locale", value));

export const tr = derived(locale, ($locale) => (key: translationKeys, fallback: string) => {
  const result = langPack[$locale] ? langPack[$locale][key] : undefined;
  if (!result) {
    if ($locale !== "en") {
      console.warn(`${key} of ${$locale} locale is not translated`);
    }
    return fallback;
  }
  return langPack[$locale][key];
});
