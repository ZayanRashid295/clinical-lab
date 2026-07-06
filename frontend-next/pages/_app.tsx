import type { AppProps } from "next/app";
import "../src/index.css";
import "../src/styles/professional-ui.css";
import { LanguageProvider } from "../src/shared/contexts/LanguageContext";
import { UIConfigProvider } from "../src/shared/contexts/UIConfigContext";
import { ConfirmProvider } from "../src/shared/contexts/ConfirmContext";
import { Toaster } from "../src/shared/ui/toaster";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UIConfigProvider>
      <LanguageProvider>
        <ConfirmProvider>
          <div
            className="medprep-site-root"
            style={{
              fontFamily: 'var(--font-sans-stack, "Source Sans 3", system-ui, sans-serif)',
              fontSize: "var(--base-font-size, 16px)",
              lineHeight: "var(--app-line-height, 1.5)",
              minHeight: "100vh",
              background: "var(--app-bg, #f4f4f5)",
              color: "var(--app-text, #18181b)",
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
