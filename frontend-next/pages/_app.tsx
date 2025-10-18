import type { AppProps } from "next/app";
import { useEffect } from "react";
import "../src/index.css";
import { UIConfigService } from "../src/app/config/ui.config";
import { ThemeService } from "../src/app/config/theme.service";
import { LanguageProvider } from "../src/shared/contexts/LanguageContext";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize theme on app load
    const config = UIConfigService.getInstance().getConfig();
    const themeService = ThemeService.getInstance();
    themeService.applyTheme(config);
  }, []);

  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
