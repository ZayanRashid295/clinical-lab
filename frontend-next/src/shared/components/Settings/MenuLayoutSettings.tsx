import React, { useState, useEffect } from "react";
import { useTheme } from "../../../hooks/useTheme";
import { COLOR_SCHEMES } from "../../../app/config/theme.service";
import { getAvailableLocales, type Locale } from "../../config/i18n";
import { useLanguage } from "../../contexts/LanguageContext";
import Toast from "../Common/Toast";

interface MenuLayoutSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuLayoutSettings: React.FC<MenuLayoutSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    config,
    setMenuLayout,
    setTheme,
    setColorScheme,
    setFontSize,
    setBorderRadius,
  } = useTheme();

  const { currentLocale, setLanguage, t, isRTL } = useLanguage();

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "warning" | "error";
  } | null>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if desktop on mount and resize
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Handle opening animation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const showToast = (
    message: string,
    type: "success" | "info" | "warning" | "error" = "success"
  ) => {
    setToast({ message, type });
  };

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

  const handleMenuLayoutChange = (layout: "vertical" | "horizontal") => {
    setMenuLayout(layout);
    showToast(`Menu layout changed to ${layout}`, "success");
  };

  const handleThemeChange = (theme: "light" | "dark") => {
    setTheme(theme);
    showToast(`Theme changed to ${theme}`, "success");
  };

  const handleColorSchemeChange = (colorScheme: string) => {
    setColorScheme(colorScheme as any);
    showToast(`Color scheme changed to ${colorScheme}`, "success");
  };

  const handleFontSizeChange = (fontSize: "small" | "medium" | "large") => {
    setFontSize(fontSize);
    showToast(`Font size changed to ${fontSize}`, "success");
  };

  const handleBorderRadiusChange = (
    borderRadius: "none" | "small" | "medium" | "large"
  ) => {
    setBorderRadius(borderRadius);
    showToast(`Border radius changed to ${borderRadius}`, "success");
  };

  const handleLanguageChange = (locale: Locale) => {
    setLanguage(locale);
    showToast(`Language changed to ${locale}`, "success");
  };

  if (!isOpen) return null;

  const transformClass = isClosing
    ? "translate-x-full"
    : isVisible
    ? "translate-x-0"
    : "translate-x-full";

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleOverlayClick}
      />

      {/* Settings Panel */}
      <div
        className={`fixed top-0 h-full w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out right-0 z-50 ${transformClass} ${
          isRTL ? "rtl" : "ltr"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Settings Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
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
              {t("common.settings")}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
                onChange={(e) => handleLanguageChange(e.target.value as Locale)}
                className="w-full p-4 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
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
                onClick={() => handleMenuLayoutChange("vertical")}
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
                  isDesktop && handleMenuLayoutChange("horizontal")
                }
                disabled={!isDesktop}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                  config.menuLayout === "horizontal"
                    ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                    : isDesktop
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

            {!isDesktop && (
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
              <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-gray-700">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`flex items-center justify-center flex-1 px-6 py-3 rounded-lg transition-all duration-200 ${
                    config.theme === "light"
                      ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
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
                  {t("common.light")}
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`flex items-center justify-center flex-1 px-6 py-3 rounded-lg transition-all duration-200 ${
                    config.theme === "dark"
                      ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
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
                  {t("common.dark")}
                </button>
              </div>
            </div>
          </div>

          {/* Color Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("common.colors")}
              </h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {Object.keys(COLOR_SCHEMES).map((scheme) => {
                const colorScheme = COLOR_SCHEMES[scheme];
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
                      onChange={() => handleColorSchemeChange(scheme)}
                      className="sr-only"
                    />
                    <div
                      className="w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg border border-gray-200 dark:border-gray-600"
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
                {t("common.typography")}
              </h3>
            </div>

            {/* Font Size Segmented Control */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("common.fontSize")}
              </h4>
              <div className="w-full">
                <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-gray-700">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleFontSizeChange(size)}
                      className={`flex items-center justify-center flex-1 px-4 py-3 rounded-lg transition-all duration-200 ${
                        config.fontSize === size
                          ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
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
                {t("common.borderRadius")}
              </h4>
              <div className="w-full">
                <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-gray-700">
                  {(["none", "small", "medium", "large"] as const).map(
                    (radius) => (
                      <button
                        key={radius}
                        onClick={() => handleBorderRadiusChange(radius)}
                        className={`flex items-center justify-center flex-1 px-4 py-3 rounded-lg transition-all duration-200 ${
                          config.borderRadius === radius
                            ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
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
    </>
  );
};

export default MenuLayoutSettings;
