import React from "react";
import { useTheme } from "../../../hooks/useTheme";
import { COLOR_SCHEMES, getColorSchemeKeysForTheme } from "../../config/theme.service";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import type { TypographyPreset } from "../../config/ui.config";
import { cn } from "@/shared/utils/cn";

function settingsOptionSelected(isDarkUi: boolean) {
  return isDarkUi
    ? "border-primary-500/55 bg-primary-900/55 text-primary-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
    : "border-primary-500 bg-primary-50 text-primary-700";
}

function settingsOptionIdle(isDarkUi: boolean) {
  return isDarkUi
    ? "border-gray-600 text-gray-200 hover:bg-gray-800/90"
    : "border-gray-300 text-gray-700 hover:bg-gray-50";
}

const SettingsPage: React.FC = () => {
  const {
    config,
    setTheme,
    setColorScheme,
    setNavbarPosition,
    setFontSize,
    setTypographyPreset,
  } = useTheme();
  const { t } = useLanguage();

  const colorKeys = getColorSchemeKeysForTheme(config.theme);
  const navIsLeft = config.menuLayout === "vertical" && config.menuStyle === "sidebar";
  const isDarkUi = config.theme === "dark";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("common.settings")}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Appearance, accent color, layout, and typography. Signed-in preferences sync to your account.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("common.theme")}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm font-medium transition",
              config.theme === "light"
                ? settingsOptionSelected(isDarkUi)
                : settingsOptionIdle(isDarkUi)
            )}
          >
            {t("common.light")}
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm font-medium transition",
              config.theme === "dark"
                ? settingsOptionSelected(isDarkUi)
                : settingsOptionIdle(isDarkUi)
            )}
          >
            {t("common.dark")}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("common.colors")}
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {config.theme === "dark"
            ? "Neutral grey accents are hidden in dark mode so the UI stays high-contrast."
            : null}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {colorKeys.map((key) => {
            const scheme = COLOR_SCHEMES[key];
            if (!scheme) return null;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setColorScheme(key)}
                className={cn(
                  "rounded-lg border p-3 text-left transition",
                  config.colorScheme === key
                    ? settingsOptionSelected(isDarkUi)
                    : settingsOptionIdle(isDarkUi)
                )}
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
                <p
                  className={cn(
                    "text-xs font-medium",
                    config.colorScheme === key && isDarkUi
                      ? "text-primary-100"
                      : "text-gray-700 dark:text-gray-200"
                  )}
                >
                  {scheme.name}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Layout</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Navbar position only (accent colors and theme stay global).
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setNavbarPosition("left")}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm font-medium transition",
              navIsLeft ? settingsOptionSelected(isDarkUi) : settingsOptionIdle(isDarkUi)
            )}
          >
            Navbar on the left
          </button>
          <button
            type="button"
            onClick={() => setNavbarPosition("top")}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm font-medium transition",
              !navIsLeft ? settingsOptionSelected(isDarkUi) : settingsOptionIdle(isDarkUi)
            )}
          >
            Navbar on the top
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20">
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
                  type="button"
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition",
                    config.fontSize === size
                      ? settingsOptionSelected(isDarkUi)
                      : settingsOptionIdle(isDarkUi)
                  )}
                >
                  {t(`common.${size}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Font style</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { id: "system" as TypographyPreset, label: "System", hint: "UI sans-serif" },
                  { id: "comfort" as TypographyPreset, label: "Comfort", hint: "Serif, relaxed reading" },
                  { id: "compact" as TypographyPreset, label: "Compact", hint: "Tighter lines" },
                ] as const
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setTypographyPreset(opt.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm font-medium transition",
                    config.typographyPreset === opt.id
                      ? settingsOptionSelected(isDarkUi)
                      : settingsOptionIdle(isDarkUi)
                  )}
                >
                  <span className="block">{opt.label}</span>
                  <span className="block text-xs font-normal opacity-80">{opt.hint}</span>
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
