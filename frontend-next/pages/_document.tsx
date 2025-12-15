import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const UI_CONFIG_KEY = "ui-config";
                  let theme = "dark"; // Default theme
                  const storedConfig = localStorage.getItem(UI_CONFIG_KEY);
                  if (storedConfig) {
                    const parsedConfig = JSON.parse(storedConfig);
                    if (parsedConfig.theme) {
                      theme = parsedConfig.theme;
                    }
                  } else {
                    // Fallback for legacy theme key
                    const legacyTheme = localStorage.getItem("theme");
                    if (legacyTheme === "light" || legacyTheme === "dark") {
                      theme = legacyTheme;
                      // Migrate legacy theme to new config format
                      localStorage.setItem(UI_CONFIG_KEY, JSON.stringify({ theme: legacyTheme }));
                    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      theme = "dark";
                    }
                  }
                  // Apply theme immediately before React hydrates
                  if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                    document.documentElement.classList.remove("light");
                  } else {
                    document.documentElement.classList.add("light");
                    document.documentElement.classList.remove("dark");
                  }
                } catch (e) {
                  console.error("Failed to apply theme from localStorage:", e);
                }
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
