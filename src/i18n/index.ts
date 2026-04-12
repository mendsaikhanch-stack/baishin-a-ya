import mn from "./mn";
import en from "./en";

export type Locale = "mn" | "en";

const dictionaries = { mn, en } as const;

// MVP: default to Mongolian
export function useTranslations(locale: Locale = "mn") {
  return dictionaries[locale] || dictionaries.mn;
}

export { mn, en };
export default mn;
