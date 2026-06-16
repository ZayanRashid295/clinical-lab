import type { AppProps } from "next/app";
import { useEffect } from "react";
import "../src/index.css";
import { UIConfigService } from "../src/app/config/ui.config";
import { ThemeService } from "../src/app/config/theme.service";
import { LanguageProvider } from "../src/shared/contexts/LanguageContext";
import { UIConfigProvider } from "../src/shared/contexts/UIConfigContext";
import { ConfirmProvider } from "../src/shared/contexts/ConfirmContext";
import { Toaster } from "../src/shared/ui/toaster";

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
        <ConfirmProvider>
          <div
            style={{
              fontFamily: "var(--font-sans-stack, system-ui, sans-serif)",
              fontSize: "var(--base-font-size, 16px)",
              lineHeight: "var(--app-line-height, 1.5)",
              minHeight: "100vh",
            }}
          >
            <Component {...pageProps} />
          </div>
          <Toaster />
        </ConfirmProvider>
      </LanguageProvider>
    </UIConfigProvider>
  );
}
