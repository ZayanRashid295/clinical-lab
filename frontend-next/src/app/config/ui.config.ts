export type UIColorScheme =
  | "blue"
  | "green"
  | "purple"
  | "red"
  | "orange"
  | "indigo"
  | "pink"
  | "teal"
  | "cyan"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "lime"
  | "slate"
  | "zinc"
  | "sky"
  | "fuchsia";

export type TypographyPreset = "system" | "comfort" | "compact";

export interface UIConfig {
  menuLayout: "vertical" | "horizontal";
  menuStyle: "sidebar" | "topbar";
  theme: "light" | "dark";
  colorScheme: UIColorScheme;
  fontSize: "small" | "medium" | "large";
  typographyPreset: TypographyPreset;
  enableAnimations: boolean;
  enableNotifications: boolean;
  /** Set when the user toggles theme locally — prevents server from overwriting on login. */
  themeUpdatedAt?: number;
}

export const DEFAULT_UI_CONFIG: UIConfig = {
  menuLayout: "vertical",
  menuStyle: "sidebar",
  theme: "light",
  colorScheme: "emerald",
  fontSize: "small",
  typographyPreset: "system",
  enableAnimations: true,
  enableNotifications: true,
};

export const UI_CONFIG_KEY = "ui-config";

/** Schemes that read as neutral/dark greys — hidden in dark theme picker to keep contrast with zinc surfaces. */
export const COLOR_SCHEMES_EXCLUDED_IN_DARK: ReadonlySet<UIColorScheme> = new Set([
  "slate",
  "zinc",
]);

function normalizeStoredConfig(raw: Record<string, unknown>): Partial<UIConfig> {
  const { borderRadius: _ignored, ...rest } = raw as Record<string, unknown> & {
    borderRadius?: unknown;
  };
  return rest as Partial<UIConfig>;
}

export class UIConfigService {
  private static instance: UIConfigService;
  private config: UIConfig;
  private listeners: Set<(config: UIConfig) => void> = new Set();

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): UIConfigService {
    if (!UIConfigService.instance) {
      UIConfigService.instance = new UIConfigService();
    }
    return UIConfigService.instance;
  }

  public subscribe(listener: (config: UIConfig) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.config));
  }

  private loadConfig(): UIConfig {
    if (typeof window === "undefined") {
      return DEFAULT_UI_CONFIG;
    }

    try {
      const stored = localStorage.getItem(UI_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        return { ...DEFAULT_UI_CONFIG, ...normalizeStoredConfig(parsed) };
      }
    } catch (error) {
      console.warn("Failed to load UI config from localStorage:", error);
    }

    return DEFAULT_UI_CONFIG;
  }

  public getConfig(): UIConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<UIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.notifyListeners();
  }

  public setMenuLayout(layout: "vertical" | "horizontal"): void {
    this.updateConfig({ menuLayout: layout });
  }

  public setMenuStyle(style: "sidebar" | "topbar"): void {
    this.updateConfig({ menuStyle: style });
  }

  /** Single UX control: left sidebar vs top navigation bar. */
  public setNavbarPosition(position: "left" | "top"): void {
    if (position === "left") {
      this.updateConfig({ menuLayout: "vertical", menuStyle: "sidebar" });
    } else {
      this.updateConfig({ menuLayout: "horizontal", menuStyle: "topbar" });
    }
  }

  public setTheme(theme: "light" | "dark"): void {
    const updates: Partial<UIConfig> = { theme, themeUpdatedAt: Date.now() };
    if (
      theme === "dark" &&
      COLOR_SCHEMES_EXCLUDED_IN_DARK.has(this.config.colorScheme)
    ) {
      updates.colorScheme = "emerald";
    }
    this.updateConfig(updates);
  }

  public setColorScheme(colorScheme: UIColorScheme): void {
    this.updateConfig({ colorScheme });
  }

  public setFontSize(fontSize: "small" | "medium" | "large"): void {
    this.updateConfig({ fontSize });
  }

  public setTypographyPreset(typographyPreset: TypographyPreset): void {
    this.updateConfig({ typographyPreset });
  }

  private saveConfig(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(UI_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.warn("Failed to save UI config to localStorage:", error);
    }
  }

  public resetConfig(): void {
    this.config = { ...DEFAULT_UI_CONFIG };
    this.saveConfig();
    this.notifyListeners();
  }
}

// React hook for using UI config
export const useUIConfig = () => {
  const [config, setConfig] = React.useState<UIConfig>(() =>
    UIConfigService.getInstance().getConfig()
  );

  React.useEffect(() => {
    const unsubscribe = UIConfigService.getInstance().subscribe(setConfig);
    return unsubscribe;
  }, []);

  const updateConfig = React.useCallback((updates: Partial<UIConfig>) => {
    UIConfigService.getInstance().updateConfig(updates);
  }, []);

  const setMenuLayout = React.useCallback(
    (layout: "vertical" | "horizontal") => {
      UIConfigService.getInstance().setMenuLayout(layout);
    },
    []
  );

  const setMenuStyle = React.useCallback((style: "sidebar" | "topbar") => {
    UIConfigService.getInstance().setMenuStyle(style);
  }, []);

  const setNavbarPosition = React.useCallback((position: "left" | "top") => {
    UIConfigService.getInstance().setNavbarPosition(position);
  }, []);

  const setTheme = React.useCallback((theme: "light" | "dark") => {
    UIConfigService.getInstance().setTheme(theme);
  }, []);

  const setColorScheme = React.useCallback((colorScheme: UIColorScheme) => {
    UIConfigService.getInstance().setColorScheme(colorScheme);
  }, []);

  const setFontSize = React.useCallback(
    (fontSize: "small" | "medium" | "large") => {
      UIConfigService.getInstance().setFontSize(fontSize);
    },
    []
  );

  const setTypographyPreset = React.useCallback(
    (typographyPreset: TypographyPreset) => {
      UIConfigService.getInstance().setTypographyPreset(typographyPreset);
    },
    []
  );

  const resetConfig = React.useCallback(() => {
    UIConfigService.getInstance().resetConfig();
  }, []);

  return {
    config,
    updateConfig,
    setMenuLayout,
    setMenuStyle,
    setNavbarPosition,
    setTheme,
    setColorScheme,
    setFontSize,
    setTypographyPreset,
    resetConfig,
  };
};

// Import React for the hook
import React from "react";
