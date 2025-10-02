import { UIConfig } from "../../../contexts/theme-context";
import { colorSchemesService } from "../color-schemes/color-schemes.service";
import { designSystemService } from "../../design-system/design-system.service";

export class ThemeApplicationService {
  applyTheme(config: UIConfig): void {
    const root = document.documentElement;

    // Apply dark mode class
    this.applyDarkMode(root, config.theme);

    // Apply color scheme
    this.applyColorScheme(root, config.colorScheme);

    // Apply font size
    this.applyFontSize(root, config.fontSize);

    // Apply border radius
    this.applyBorderRadius(root, config.borderRadius);

    // Apply design system
    this.applyDesignSystem(config.designSystem);
  }

  private applyDarkMode(root: HTMLElement, theme: string): void {
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  private applyColorScheme(root: HTMLElement, colorScheme: string): void {
    const scheme = colorSchemesService.getColorScheme(colorScheme);

    // Apply primary colors
    Object.entries(scheme.primary).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color);
    });

    // Apply secondary colors
    Object.entries(scheme.secondary).forEach(([shade, color]) => {
      root.style.setProperty(`--color-secondary-${shade}`, color);
    });

    // Set legacy variables for backward compatibility
    root.style.setProperty("--primary-color", scheme.primary[500]);
    root.style.setProperty("--secondary-color", scheme.secondary[500]);
  }

  private applyFontSize(root: HTMLElement, fontSize: string): void {
    const sizeMap: Record<string, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };

    root.style.setProperty("--base-font-size", sizeMap[fontSize]);
    root.style.fontSize = sizeMap[fontSize];
  }

  private applyBorderRadius(root: HTMLElement, borderRadius: string): void {
    const radiusMap: Record<string, string> = {
      none: "0px",
      small: "4px",
      medium: "8px",
      large: "12px",
    };

    root.style.setProperty("--border-radius-base", radiusMap[borderRadius]);
  }

  private applyDesignSystem(designSystem: string): void {
    designSystemService.setCurrentDesignSystem(designSystem as any);
  }
}

// Export singleton instance
export const themeApplicationService = new ThemeApplicationService();
