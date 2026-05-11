import React, { createContext, useContext, ReactNode } from "react";
import {
  UIConfig,
  UIConfigService,
  type UIColorScheme,
  type TypographyPreset,
} from "../../app/config/ui.config";
import { ThemeService } from "../../app/config/theme.service";
import { authService } from "../services/auth.service";
import { applyServerPrefsToUiConfig } from "../utils/ui-preferences-sync";

interface UIConfigContextType {
  config: UIConfig;
  updateConfig: (updates: Partial<UIConfig>) => void;
  setMenuLayout: (layout: "vertical" | "horizontal") => void;
  setMenuStyle: (style: "sidebar" | "topbar") => void;
  setNavbarPosition: (position: "left" | "top") => void;
  setTheme: (theme: "light" | "dark") => void;
  setColorScheme: (colorScheme: UIColorScheme) => void;
  setFontSize: (fontSize: "small" | "medium" | "large") => void;
  setTypographyPreset: (preset: TypographyPreset) => void;
  resetConfig: () => void;
}

export const UIConfigContext = createContext<UIConfigContextType | undefined>(
  undefined
);

interface UIConfigProviderProps {
  children: ReactNode;
}

export const UIConfigProvider: React.FC<UIConfigProviderProps> = ({
  children,
}) => {
  const [config, setConfig] = React.useState<UIConfig>(() =>
    UIConfigService.getInstance().getConfig()
  );
  const themeService = React.useRef(ThemeService.getInstance());

  React.useEffect(() => {
    const unsubscribe = UIConfigService.getInstance().subscribe(setConfig);
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined" || !authService.isAuthenticated()) {
        return;
      }
      try {
        const prefs = await authService.getUiPreferences();
        if (!cancelled && prefs && Object.keys(prefs).length > 0) {
          applyServerPrefsToUiConfig(prefs as Parameters<typeof applyServerPrefsToUiConfig>[0]);
        }
      } catch {
        /* offline or older backend */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      themeService.current.applyTheme(config);
    }
  }, [config]);

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
    (preset: TypographyPreset) => {
      UIConfigService.getInstance().setTypographyPreset(preset);
    },
    []
  );

  const resetConfig = React.useCallback(() => {
    UIConfigService.getInstance().resetConfig();
  }, []);

  const value: UIConfigContextType = {
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

  return (
    <UIConfigContext.Provider value={value}>
      {children}
    </UIConfigContext.Provider>
  );
};

export const useUIConfigContext = (): UIConfigContextType => {
  const context = useContext(UIConfigContext);
  if (context === undefined) {
    throw new Error(
      "useUIConfigContext must be used within a UIConfigProvider"
    );
  }
  return context;
};
