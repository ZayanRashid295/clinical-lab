"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/theme-context";
import { useLanguage } from "../../contexts/language-context";
import { colorSchemesService } from "../../services/theme/color-schemes/color-schemes.service";
import { designSystemService } from "../../services/design-system/design-system.service";
import { getAvailableLocales, type Locale } from "../../config/i18n";
import { useResponsiveLayout } from "../../services/responsive/responsive.service";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    config,
    setTheme,
    setColorScheme,
    setFontSize,
    setBorderRadius,
    setDesignSystem,
    setMenuLayout,
  } = useTheme();
  const { currentLocale, setLanguage, t, isRTL } = useLanguage();
  const responsiveState = useResponsiveLayout();
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Positioning classes for RTL/LTR support
  const positionClass = isRTL ? "left-0" : "right-0";
  const transformClass = isClosing
    ? isRTL
      ? "-translate-x-full"
      : "translate-x-full"
    : isVisible
    ? "translate-x-0"
    : isRTL
    ? "-translate-x-full"
    : "translate-x-full";

  // Handle opening animation
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the panel starts off-screen
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const onThemeChange = (theme: "light" | "dark") => {
    setTheme(theme);
  };

  const onColorSchemeChange = (colorScheme: string) => {
    setColorScheme(colorScheme as any);
  };

  const onFontSizeChange = (fontSize: "small" | "medium" | "large") => {
    setFontSize(fontSize);
  };

  const onBorderRadiusChange = (
    borderRadius: "none" | "small" | "medium" | "large"
  ) => {
    setBorderRadius(borderRadius);
  };

  const onDesignSystemChange = (
    designSystem: "glassmorphic" | "minimalistic" | "skeumorphic" | "neumorphic"
  ) => {
    setDesignSystem(designSystem);
  };

  const onLanguageChange = (locale: Locale) => {
    setLanguage(locale);
  };

  const onMenuLayoutChange = (menuLayout: "vertical" | "horizontal") => {
    setMenuLayout(menuLayout);
  };

  if (!isOpen) return null;

  const availableColorSchemes = colorSchemesService.getAvailableColorSchemes();

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      } ${isRTL ? "rtl" : "ltr"}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`${designSystemService.getDesignSystemClasses(
          config.designSystem,
          "modal"
        )} fixed top-0 h-full w-full max-w-sm sm:max-w-md shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out ${positionClass} ${transformClass}`}
        style={{
          [isRTL ? "left" : "right"]: "0",
          [isRTL ? "right" : "left"]: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Settings Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${designSystemService.getDesignSystemClasses(
            config.designSystem,
            "border"
          )}`}
        >
          <div
            className={`flex items-center ${
              isRTL ? "space-x-reverse space-x-3" : "space-x-3"
            }`}
          >
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Settings
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={`${designSystemService.getDesignSystemClasses(
              config.designSystem,
              "button"
            )} text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
            aria-label="Close settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-8">
          {/* Language Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("common.language")}
              </h3>
            </div>

            <div className="relative">
              <select
                value={currentLocale}
                onChange={(e) => onLanguageChange(e.target.value as Locale)}
                className={`w-full p-4 rounded-xl text-gray-900 dark:text-white focus:outline-none appearance-none cursor-pointer transition-all duration-200 ${designSystemService.getDesignSystemClasses(
                  config.designSystem,
                  "input"
                )}`}
              >
                {getAvailableLocales().map((locale) => (
                  <option key={locale.code} value={locale.code}>
                    {locale.flag} {locale.nativeName} ({locale.name})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Menu Layout Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Menu Layout
              </h3>
            </div>

            {/* Segmented Control */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                onClick={() => onMenuLayoutChange("vertical")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                  config.menuLayout === "vertical"
                    ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h6M4 10h6M4 14h6M4 18h6M14 6h6M14 10h6M14 14h6M14 18h6"
                  />
                </svg>
                <span className="font-medium">Vertical</span>
              </button>

              <button
                onClick={() =>
                  responsiveState.isDesktop && onMenuLayoutChange("horizontal")
                }
                disabled={!responsiveState.isDesktop}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                  config.menuLayout === "horizontal"
                    ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                    : responsiveState.isDesktop
                    ? "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                <span className="font-medium">Horizontal</span>
              </button>
            </div>

            {!responsiveState.isDesktop && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Horizontal menu is only available on desktop screens (1024px+)
              </p>
            )}
          </div>

          {/* Theme Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("common.theme")}
              </h3>
            </div>

            {/* Theme Mode Segmented Control */}
            <div className="w-full">
              <div
                className={`flex rounded-xl p-1 ${designSystemService.getDesignSystemClasses(
                  config.designSystem,
                  "card"
                )}`}
              >
                <button
                  onClick={() => onThemeChange("light")}
                  className={`flex items-center justify-center flex-1 px-6 py-3 rounded-lg transition-all duration-200 ${
                    config.theme === "light"
                      ? `${designSystemService.getDesignSystemClasses(
                          config.designSystem,
                          "button"
                        )} text-gray-900 dark:text-white`
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Light
                </button>
                <button
                  onClick={() => onThemeChange("dark")}
                  className={`flex items-center justify-center flex-1 px-6 py-3 rounded-lg transition-all duration-200 ${
                    config.theme === "dark"
                      ? `${designSystemService.getDesignSystemClasses(
                          config.designSystem,
                          "button"
                        )} text-gray-900 dark:text-white`
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Design System Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Design System
              </h3>
            </div>

            {/* Design System Segmented Control */}
            <div className="w-full">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: "glassmorphic", label: "Glassmorphic", icon: "🔮" },
                    { key: "minimalistic", label: "Minimalistic", icon: "⚪" },
                    { key: "skeumorphic", label: "Skeumorphic", icon: "📱" },
                    { key: "neumorphic", label: "Neumorphic", icon: "🔘" },
                  ] as const
                ).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => onDesignSystemChange(key)}
                    className={`flex items-center justify-center p-4 rounded-xl transition-all duration-200 ${
                      config.designSystem === key
                        ? `${designSystemService.getDesignSystemClasses(
                            config.designSystem,
                            "button"
                          )} shadow-md`
                        : `${designSystemService.getDesignSystemClasses(
                            config.designSystem,
                            "card"
                          )} hover:opacity-80`
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Colors
              </h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {availableColorSchemes.map((scheme) => {
                const colorScheme = colorSchemesService.getColorScheme(scheme);
                return (
                  <label
                    key={scheme}
                    className={`cursor-pointer ${
                      config.colorScheme === scheme
                        ? "ring-2 ring-gray-400 dark:ring-gray-500"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="colorScheme"
                      value={scheme}
                      checked={config.colorScheme === scheme}
                      onChange={() => onColorSchemeChange(scheme)}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg ${designSystemService.getDesignSystemClasses(
                        config.designSystem,
                        "border"
                      )}`}
                      style={{ backgroundColor: colorScheme.primary[500] }}
                      title={scheme}
                    ></div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Typography Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Typography
              </h3>
            </div>

            {/* Font Size Segmented Control */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Font Size
              </h4>
              <div className="w-full">
                <div
                  className={`flex rounded-xl p-1 ${designSystemService.getDesignSystemClasses(
                    config.designSystem,
                    "card"
                  )}`}
                >
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => onFontSizeChange(size)}
                      className={`flex items-center justify-center flex-1 px-4 py-3 rounded-lg transition-all duration-200 ${
                        config.fontSize === size
                          ? `${designSystemService.getDesignSystemClasses(
                              config.designSystem,
                              "button"
                            )} text-gray-900 dark:text-white`
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          size === "small"
                            ? "text-sm"
                            : size === "medium"
                            ? "text-base"
                            : "text-lg"
                        }`}
                      >
                        Aa
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Border Radius Segmented Control */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Border Radius
              </h4>
              <div className="w-full">
                <div
                  className={`flex rounded-xl p-1 ${designSystemService.getDesignSystemClasses(
                    config.designSystem,
                    "card"
                  )}`}
                >
                  {(["none", "small", "medium", "large"] as const).map(
                    (radius) => (
                      <button
                        key={radius}
                        onClick={() => onBorderRadiusChange(radius)}
                        className={`flex items-center justify-center flex-1 px-4 py-3 rounded-lg transition-all duration-200 ${
                          config.borderRadius === radius
                            ? `${designSystemService.getDesignSystemClasses(
                                config.designSystem,
                                "button"
                              )} text-gray-900 dark:text-white`
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 bg-primary-500 ${
                            radius === "none"
                              ? "rounded-none"
                              : radius === "small"
                              ? "rounded-sm"
                              : radius === "medium"
                              ? "rounded-md"
                              : "rounded-lg"
                          }`}
                        ></div>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
