import {
  UIConfigService,
  type UIConfig,
  type UIColorScheme,
  type TypographyPreset,
} from "../../app/config/ui.config";

export type ServerUiPreferences = {
  uiTheme?: string | null;
  uiColorScheme?: string | null;
  uiMenuLayout?: string | null;
  uiMenuStyle?: string | null;
  uiFontSize?: string | null;
  uiTypographyPreset?: string | null;
};

const COLOR_KEYS = new Set<string>([
  "blue",
  "green",
  "purple",
  "red",
  "orange",
  "indigo",
  "pink",
  "teal",
  "cyan",
  "emerald",
  "violet",
  "rose",
  "amber",
  "lime",
  "slate",
  "zinc",
  "sky",
  "fuchsia",
]);

/** Merge API `user_settings` UI columns into local UIConfig (server wins). */
export function applyServerPrefsToUiConfig(prefs: ServerUiPreferences | null | undefined): void {
  if (!prefs || typeof prefs !== "object") return;

  const updates: Partial<UIConfig> = {};

  if (prefs.uiTheme === "light" || prefs.uiTheme === "dark") {
    updates.theme = prefs.uiTheme;
  }
  if (prefs.uiColorScheme && COLOR_KEYS.has(prefs.uiColorScheme)) {
    updates.colorScheme = prefs.uiColorScheme as UIColorScheme;
  }
  if (prefs.uiMenuLayout === "vertical" || prefs.uiMenuLayout === "horizontal") {
    updates.menuLayout = prefs.uiMenuLayout;
  }
  if (prefs.uiMenuStyle === "sidebar" || prefs.uiMenuStyle === "topbar") {
    updates.menuStyle = prefs.uiMenuStyle;
  }
  if (prefs.uiFontSize === "small" || prefs.uiFontSize === "medium" || prefs.uiFontSize === "large") {
    updates.fontSize = prefs.uiFontSize;
  }
  if (
    prefs.uiTypographyPreset === "system" ||
    prefs.uiTypographyPreset === "comfort" ||
    prefs.uiTypographyPreset === "compact"
  ) {
    updates.typographyPreset = prefs.uiTypographyPreset as TypographyPreset;
  }

  if (Object.keys(updates).length === 0) return;

  UIConfigService.getInstance().updateConfig(updates);
}

export function configToServerPatchBody(config: UIConfig): ServerUiPreferences {
  return {
    uiTheme: config.theme,
    uiColorScheme: config.colorScheme,
    uiMenuLayout: config.menuLayout,
    uiMenuStyle: config.menuStyle,
    uiFontSize: config.fontSize,
    uiTypographyPreset: config.typographyPreset,
  };
}
