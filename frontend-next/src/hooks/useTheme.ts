import { useEffect } from "react";
import { useUIConfigContext } from "../shared/contexts/UIConfigContext";
import { ThemeService } from "../app/config/theme.service";

export const useTheme = () => {
  const {
    config,
    setMenuLayout,
    setMenuStyle,
    setTheme,
    setColorScheme,
    setFontSize,
    setBorderRadius,
    updateConfig,
  } = useUIConfigContext();
  const themeService = ThemeService.getInstance();

  // Apply theme whenever config changes
  useEffect(() => {
    themeService.applyTheme(config);
  }, [config, themeService]);


  return {
    config,
    setMenuLayout,
    setMenuStyle,
    setTheme,
    setColorScheme,
    setFontSize,
    setBorderRadius,
    updateConfig,
    themeService,
  };
};

export default useTheme;
