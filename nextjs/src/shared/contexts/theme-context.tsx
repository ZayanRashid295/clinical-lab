"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { themeApplicationService } from "../services/theme/application/theme-application.service";

// Types matching Angular's UIConfig
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
    | "fuchsia"
    | "rose"
    | "amber"
    | "lime"
    | "sky"
    | "slate"
    | "zinc"
    | "neutral"
    | "stone";
  fontSize: "small" | "medium" | "large";
  borderRadius: "none" | "small" | "medium" | "large";
  designSystem: "glassmorphic" | "minimalistic" | "skeumorphic" | "neumorphic";
  enableAnimations: boolean;
  enableSearch: boolean;
  enableNotifications: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export const DEFAULT_UI_CONFIG: UIConfig = {
  menuLayout: "vertical",
  menuStyle: "sidebar",
  theme: "dark",
  colorScheme: "blue",
  fontSize: "medium",
  borderRadius: "medium",
  designSystem: "minimalistic",
  enableAnimations: true,
  enableSearch: true,
  enableNotifications: true,
};

export const UI_CONFIG_KEY = "ui-config";

interface ThemeContextType {
  config: UIConfig;
  updateConfig: (updates: Partial<UIConfig>) => void;
  setTheme: (theme: "light" | "dark") => void;
  setColorScheme: (colorScheme: UIConfig["colorScheme"]) => void;
  setMenuLayout: (layout: "vertical" | "horizontal") => void;
  setMenuStyle: (style: "sidebar" | "topbar") => void;
  setFontSize: (fontSize: UIConfig["fontSize"]) => void;
  setBorderRadius: (borderRadius: UIConfig["borderRadius"]) => void;
  setDesignSystem: (designSystem: UIConfig["designSystem"]) => void;
  resetConfig: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<UIConfig>(DEFAULT_UI_CONFIG);

  // Load config from localStorage on mount
  useEffect(() => {
    const loadConfig = () => {
      if (typeof window === "undefined") return;

      try {
        const stored = localStorage.getItem(UI_CONFIG_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const newConfig = { ...DEFAULT_UI_CONFIG, ...parsed };
          setConfig(newConfig);
          // Apply theme immediately after loading
          themeApplicationService.applyTheme(newConfig);
        } else {
          // Apply default theme if no stored config
          themeApplicationService.applyTheme(DEFAULT_UI_CONFIG);
        }
      } catch (error) {
        console.warn("Failed to load UI config from localStorage:", error);
        setConfig(DEFAULT_UI_CONFIG);
        // Apply default theme on error
        themeApplicationService.applyTheme(DEFAULT_UI_CONFIG);
      }
    };

    loadConfig();
  }, []);

  // Save config to localStorage and apply theme whenever it changes
  useEffect(() => {
    const saveConfig = (configToSave: UIConfig) => {
      if (typeof window === "undefined") return;

      try {
        localStorage.setItem(UI_CONFIG_KEY, JSON.stringify(configToSave));
        // Apply theme changes to the DOM
        themeApplicationService.applyTheme(configToSave);
      } catch (error) {
        console.warn("Failed to save UI config to localStorage:", error);
      }
    };

    saveConfig(config);
  }, [config]);

  const updateConfig = (updates: Partial<UIConfig>) => {
    setConfig((prevConfig) => ({ ...prevConfig, ...updates }));
  };

  const setTheme = (theme: "light" | "dark") => {
    updateConfig({ theme });
  };

  const setColorScheme = (colorScheme: UIConfig["colorScheme"]) => {
    updateConfig({ colorScheme });
  };

  const setMenuLayout = (menuLayout: "vertical" | "horizontal") => {
    updateConfig({ menuLayout });
  };

  const setMenuStyle = (menuStyle: "sidebar" | "topbar") => {
    updateConfig({ menuStyle });
  };

  const setFontSize = (fontSize: UIConfig["fontSize"]) => {
    updateConfig({ fontSize });
  };

  const setBorderRadius = (borderRadius: UIConfig["borderRadius"]) => {
    updateConfig({ borderRadius });
  };

  const setDesignSystem = (designSystem: UIConfig["designSystem"]) => {
    updateConfig({ designSystem });
  };

  const resetConfig = () => {
    setConfig({ ...DEFAULT_UI_CONFIG });
  };

  const value: ThemeContextType = {
    config,
    updateConfig,
    setTheme,
    setColorScheme,
    setMenuLayout,
    setMenuStyle,
    setFontSize,
    setBorderRadius,
    setDesignSystem,
    resetConfig,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
