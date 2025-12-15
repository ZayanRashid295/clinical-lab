import React, { createContext, useContext, ReactNode } from "react";
import { UIConfig, UIConfigService } from "../../app/config/ui.config";
import { ThemeService } from "../../app/config/theme.service";

interface UIConfigContextType {
  config: UIConfig;
  updateConfig: (updates: Partial<UIConfig>) => void;
  setMenuLayout: (layout: "vertical" | "horizontal") => void;
  setMenuStyle: (style: "sidebar" | "topbar") => void;
  setTheme: (theme: "light" | "dark") => void;
  setColorScheme: (
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
  ) => void;
  setFontSize: (fontSize: "small" | "medium" | "large") => void;
  setBorderRadius: (
    borderRadius: "none" | "small" | "medium" | "large"
  ) => void;
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

  // CRITICAL: Apply theme whenever config changes to keep all pages in sync
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

  const value: UIConfigContextType = {
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
