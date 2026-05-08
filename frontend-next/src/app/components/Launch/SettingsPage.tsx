import React from "react";
import { useTheme } from "../../../hooks/useTheme";
import { COLOR_SCHEMES } from "../../config/theme.service";
import { getAvailableLocales, type Locale } from "../../../shared/config/i18n";
import { useLanguage } from "../../../shared/contexts/LanguageContext";

const SettingsPage: React.FC = () => {
  const {
    config,
    setTheme,
    setColorScheme,
    setMenuLayout,
    setFontSize,
    setBorderRadius,
  } = useTheme();
  const { currentLocale, setLanguage, t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("common.settings")}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Manage your appearance and language preferences from one place.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("common.language")}
        </h2>
        <select
          value={currentLocale}
          onChange={(e) => setLanguage(e.target.value as Locale)}
          className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          {getAvailableLocales().map((locale) => (
            <option key={locale.code} value={locale.code}>
              {locale.flag} {locale.nativeName} ({locale.name})
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("common.theme")}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => setTheme("light")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
              config.theme === "light"
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            {t("common.light")}
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
              config.theme === "dark"
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            {t("common.dark")}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("common.colors")}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
            <button
              key={key}
              onClick={() => setColorScheme(key as any)}
              className={`rounded-lg border p-3 text-left transition ${
                config.colorScheme === key
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              }`}
              title={scheme.name}
            >
              <div className="mb-2 flex gap-1">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: scheme.primary[500] }}
                />
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: scheme.primary[600] }}
                />
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: scheme.primary[700] }}
                />
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                {scheme.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Layout
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => setMenuLayout("vertical")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
              config.menuLayout === "vertical"
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            Vertical
          </button>
          <button
            onClick={() => setMenuLayout("horizontal")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
              config.menuLayout === "horizontal"
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            Horizontal
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("common.typography")}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("common.fontSize")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    config.fontSize === size
                      ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  {t(`common.${size}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("common.borderRadius")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["none", "small", "medium", "large"] as const).map((radius) => (
                <button
                  key={radius}
                  onClick={() => setBorderRadius(radius)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    config.borderRadius === radius
                      ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  {t(`common.${radius}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
