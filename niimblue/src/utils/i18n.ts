import { derived, writable } from "svelte/store";
import { langPack } from "../lang_pack";

export const locales = Object.keys(langPack);

export const locale = writable(localStorage.getItem("locale") ?? "en");
locale.subscribe((value: string) => localStorage.setItem("locale", value));

export const tr = derived(locale, ($locale) => (key: string, fallback: string) => {
  const result = langPack[$locale] ? langPack[$locale][key] : undefined;
  if (!result) {
    if ($locale !== "en") {
      console.warn(`${key} of ${$locale} locale is not translated`);
    }
    return fallback;
  }
  return langPack[$locale][key];
});
