import type { AppProps } from "next/app";
import { useEffect } from "react";
import "../src/index.css";
import { UIConfigService } from "../src/app/config/ui.config";
import { ThemeService } from "../src/app/config/theme.service";
import { LanguageProvider } from "../src/shared/contexts/LanguageContext";
import { UIConfigProvider } from "../src/shared/contexts/UIConfigContext";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize theme on app load - this ensures theme is applied even before UIConfigProvider mounts
    // The UIConfigProvider will also apply theme when config changes, so this is just for initial load
    const config = UIConfigService.getInstance().getConfig();
    const themeService = ThemeService.getInstance();
    themeService.applyTheme(config);
  }, []);

  return (
    <UIConfigProvider>
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </UIConfigProvider>
  );
}
