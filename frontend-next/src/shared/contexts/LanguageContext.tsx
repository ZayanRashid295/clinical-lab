"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  type Locale,
  isRTL,
  getLocaleInfo,
  defaultLocale,
} from "../config/i18n";

// Import all locale files
import enTranslations from "../../locale/en.json";
import arTranslations from "../../locale/ar.json";
import esTranslations from "../../locale/es.json";
import frTranslations from "../../locale/fr.json";
import deTranslations from "../../locale/de.json";
import zhTranslations from "../../locale/zh.json";
import jaTranslations from "../../locale/ja.json";
import koTranslations from "../../locale/ko.json";
import urTranslations from "../../locale/ur.json";
import hiTranslations from "../../locale/hi.json";

const translations = {
  en: enTranslations,
  ar: arTranslations,
  es: esTranslations,
  fr: frTranslations,
  de: deTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
  ko: koTranslations,
  ur: urTranslations,
  hi: hiTranslations,
};

interface LanguageContextType {
  currentLocale: Locale;
  isRTL: boolean;
  localeInfo: ReturnType<typeof getLocaleInfo>;
  setLanguage: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Helper function to get nested translation
const getNestedTranslation = (obj: any, key: string): string => {
  const keys = key.split(".");
  let result = obj;

  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = result[k];
    } else {
      return key; // Return the key if translation not found
    }
  }

  return typeof result === "string" ? result : key;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);

  // Load locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem("locale") as Locale;
      if (savedLocale && translations[savedLocale]) {
        setCurrentLocale(savedLocale);
      }
    }
  }, []);

  const setLanguage = (newLocale: Locale) => {
    setCurrentLocale(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
    }
  };

  const t = (key: string): string => {
    const currentTranslations = translations[currentLocale];
    return getNestedTranslation(currentTranslations, key);
  };

  const value: LanguageContextType = {
    currentLocale,
    isRTL: isRTL(currentLocale),
    localeInfo: getLocaleInfo(currentLocale),
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
