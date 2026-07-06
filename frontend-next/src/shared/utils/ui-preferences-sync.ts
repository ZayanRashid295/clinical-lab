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

export type ServerPrefsMergeResult = {
  /** True when local theme should be pushed to the server (user chose locally). */
  pushLocalTheme: boolean;
};

function localThemeIsExplicit(): boolean {
  const local = UIConfigService.getInstance().getConfig();
  return typeof local.themeUpdatedAt === "number" && local.themeUpdatedAt > 0;
}

/** Merge API `user_settings` UI columns into local UIConfig. Local theme wins once the user has toggled it. */
export function applyServerPrefsToUiConfig(
  prefs: ServerUiPreferences | null | undefined,
): ServerPrefsMergeResult {
  const result: ServerPrefsMergeResult = { pushLocalTheme: false };
  if (!prefs || typeof prefs !== "object") return result;

  const local = UIConfigService.getInstance().getConfig();
  const updates: Partial<UIConfig> = {};
  const explicitLocalTheme = localThemeIsExplicit();

  if (prefs.uiTheme === "light" || prefs.uiTheme === "dark") {
    if (explicitLocalTheme) {
      if (prefs.uiTheme !== local.theme) {
        result.pushLocalTheme = true;
      }
    } else {
      updates.theme = prefs.uiTheme;
    }
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

  if (Object.keys(updates).length > 0) {
    UIConfigService.getInstance().updateConfig(updates);
  }

  return result;
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
