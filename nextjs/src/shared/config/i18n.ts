import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

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
export const localeConfig = {
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

// Next-intl configuration
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../../locale/${locale}.json`)).default,
    timeZone: "UTC",
    now: new Date(),
  };
});
