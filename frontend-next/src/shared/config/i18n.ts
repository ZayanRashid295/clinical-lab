// i18n Configuration
// Multi-lingual support configuration

// Supported locales
export const locales = [
  "en",
  "ar",
  "es",
  "fr",
  "de",
  "zh",
  "ja",
  "ko",
  "ur",
  "hi",
] as const;

export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = "en";

// Locale configuration
export const localeConfig: Record<
  Locale,
  {
    name: string;
    nativeName: string;
    direction: "ltr" | "rtl";
    flag: string;
  }
> = {
  en: {
    name: "English",
    nativeName: "English",
    direction: "ltr",
    flag: "🇺🇸",
  },
  ar: {
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
    flag: "🇸🇦",
  },
  es: {
    name: "Spanish",
    nativeName: "Español",
    direction: "ltr",
    flag: "🇪🇸",
  },
  fr: {
    name: "French",
    nativeName: "Français",
    direction: "ltr",
    flag: "🇫🇷",
  },
  de: {
    name: "German",
    nativeName: "Deutsch",
    direction: "ltr",
    flag: "🇩🇪",
  },
  zh: {
    name: "Chinese",
    nativeName: "中文",
    direction: "ltr",
    flag: "🇨🇳",
  },
  ja: {
    name: "Japanese",
    nativeName: "日本語",
    direction: "ltr",
    flag: "🇯🇵",
  },
  ko: {
    name: "Korean",
    nativeName: "한국어",
    direction: "ltr",
    flag: "🇰🇷",
  },
  ur: {
    name: "Urdu",
    nativeName: "اردو",
    direction: "rtl",
    flag: "🇵🇰",
  },
  hi: {
    name: "Hindi",
    nativeName: "हिन्दी",
    direction: "ltr",
    flag: "🇮🇳",
  },
};

// Get locale info
export const getLocaleInfo = (locale: Locale) => {
  return localeConfig[locale];
};

// Check if locale is RTL
export const isRTL = (locale: Locale): boolean => {
  return localeConfig[locale].direction === "rtl";
};

// Get available locales
export const getAvailableLocales = () => {
  return locales.map((locale) => ({
    code: locale,
    ...localeConfig[locale],
  }));
};

