import React from "react";
import { AuthProvider } from "../shared/contexts/auth-context";
import { ThemeProvider } from "../shared/contexts/theme-context";
import { LanguageProvider } from "../shared/contexts/language-context";
import { LearningProvider } from "../shared/contexts/learning-context";
import ThemeWrapper from "../shared/components/theme-wrapper/theme-wrapper";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <LearningProvider>
                <ThemeWrapper>{children}</ThemeWrapper>
              </LearningProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
