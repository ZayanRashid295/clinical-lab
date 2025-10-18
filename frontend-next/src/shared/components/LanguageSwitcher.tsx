"use client";

import React, { useState } from "react";
import { getAvailableLocales, type Locale } from "../config/i18n";
import { useLanguage } from "../contexts/LanguageContext";

interface LanguageSwitcherProps {
  floating?: boolean;
  position?: "bottom-right" | "bottom-left";
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  floating = false,
  position = "bottom-right",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLocale, setLanguage } = useLanguage();
  const availableLocales = getAvailableLocales();

  const handleLanguageChange = (locale: Locale) => {
    setLanguage(locale);
    setIsOpen(false);
  };

  const currentLocaleInfo =
    availableLocales.find((locale) => locale.code === currentLocale) ||
    availableLocales[0]; // Fallback to first locale if not found

  const containerClasses = floating
    ? `fixed ${
        position === "bottom-left" ? "bottom-4 left-4" : "bottom-4 right-4"
      } z-50`
    : "";

  const buttonClasses = floating
    ? "w-12 h-12 rounded-full bg-white hover:bg-gray-100 text-black shadow-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
    : `inline-flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-gray-100 text-black shadow-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`;

  return (
    <div className={`relative ${containerClasses}`}>
      {/* Language Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
        title={`Current language: ${currentLocaleInfo?.name}`}
        aria-label="Change language"
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 9999,
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "white",
          border: "2px solid #d1d5db",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        <span>{currentLocaleInfo?.flag || "🌐"}</span>
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] z-50">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Language
              </p>
            </div>

            {availableLocales.map((locale) => (
              <button
                key={locale.code}
                onClick={() => handleLanguageChange(locale.code)}
                className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  locale.code === currentLocale
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="text-lg mr-3">{locale.flag}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{locale.nativeName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {locale.name}
                  </span>
                </div>
                {locale.code === currentLocale && (
                  <span className="ml-auto text-primary-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
