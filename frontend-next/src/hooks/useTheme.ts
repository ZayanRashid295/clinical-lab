import { useEffect } from "react";
import { useUIConfigContext } from "../shared/contexts/UIConfigContext";
import { ThemeService } from "../app/config/theme.service";

export const useTheme = () => {
  const {
    config,
    setMenuLayout,
    setMenuStyle,
    setNavbarPosition,
    setTheme,
    setColorScheme,
    setFontSize,
    setTypographyPreset,
    updateConfig,
  } = useUIConfigContext();
  const themeService = ThemeService.getInstance();

  useEffect(() => {
    themeService.applyTheme(config);
  }, [config, themeService]);

  return {
    config,
    setMenuLayout,
    setMenuStyle,
    setNavbarPosition,
    setTheme,
    setColorScheme,
    setFontSize,
    setTypographyPreset,
    updateConfig,
    themeService,
  };
};

export default useTheme;
