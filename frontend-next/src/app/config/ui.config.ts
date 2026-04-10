export interface UIConfig {
  menuLayout: "vertical" | "horizontal";
  menuStyle: "sidebar" | "topbar";
  theme: "light" | "dark";
  colorScheme:
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
  fontSize: "small" | "medium" | "large";
  borderRadius: "none" | "small" | "medium" | "large";
  enableAnimations: boolean;
  enableNotifications: boolean;
}

export const DEFAULT_UI_CONFIG: UIConfig = {
  menuLayout: "vertical",
  menuStyle: "sidebar",
  theme: "dark",
  colorScheme: "blue",
  fontSize: "medium",
  borderRadius: "medium",
  enableAnimations: true,
  enableNotifications: true,
};

export const UI_CONFIG_KEY = "ui-config";

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
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_UI_CONFIG, ...parsed };
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

  public setTheme(theme: "light" | "dark"): void {
    this.updateConfig({ theme });
  }

  public setColorScheme(
    colorScheme:
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
      | "fuchsia"
  ): void {
    this.updateConfig({ colorScheme });
  }

  public setFontSize(fontSize: "small" | "medium" | "large"): void {
    this.updateConfig({ fontSize });
  }

  public setBorderRadius(
    borderRadius: "none" | "small" | "medium" | "large"
  ): void {
    this.updateConfig({ borderRadius });
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

  const setTheme = React.useCallback((theme: "light" | "dark") => {
    UIConfigService.getInstance().setTheme(theme);
  }, []);

  const setColorScheme = React.useCallback(
    (
      colorScheme:
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
        | "fuchsia"
    ) => {
      UIConfigService.getInstance().setColorScheme(colorScheme);
    },
    []
  );

  const setFontSize = React.useCallback(
    (fontSize: "small" | "medium" | "large") => {
      UIConfigService.getInstance().setFontSize(fontSize);
    },
    []
  );

  const setBorderRadius = React.useCallback(
    (borderRadius: "none" | "small" | "medium" | "large") => {
      UIConfigService.getInstance().setBorderRadius(borderRadius);
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
    setTheme,
    setColorScheme,
    setFontSize,
    setBorderRadius,
    resetConfig,
  };
};

// Import React for the hook
import React from "react";
