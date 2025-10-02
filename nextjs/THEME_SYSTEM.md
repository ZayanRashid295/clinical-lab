# Theme System Documentation

This document describes the comprehensive theming system implemented in the Next.js application, matching the functionality of the Angular version.

## Overview

The theme system provides:

- **Color Palette Management**: 20+ predefined color schemes
- **Dark/Light Mode**: Seamless theme switching
- **Settings Modal**: Complete theme customization interface
- **Floating Controls**: Always-accessible theme toggle and settings buttons
- **Persistent Storage**: Theme preferences saved to localStorage
- **CSS Variables**: Dynamic theming through CSS custom properties

## Architecture

### Core Components

1. **ThemeContext** (`src/shared/contexts/theme-context.tsx`)

   - Main theme state management
   - Provides theme configuration and update methods
   - Handles localStorage persistence

2. **ColorSchemesService** (`src/shared/services/theme/color-schemes/color-schemes.service.ts`)

   - Manages 20+ color schemes (blue, red, green, purple, orange, etc.)
   - Provides color palette data for each scheme
   - Singleton service for consistent color management

3. **ThemeApplicationService** (`src/shared/services/theme/application/theme-application.service.ts`)

   - Applies theme changes to the DOM
   - Updates CSS custom properties
   - Handles dark mode class toggling

4. **ThemeToggle** (`src/shared/components/theme-toggle/theme-toggle.tsx`)

   - Floating dark/light mode toggle button
   - Configurable positioning (bottom-right, bottom-left)
   - Accessible with proper ARIA labels

5. **SettingsModal** (`src/shared/components/settings/settings-modal.tsx`)

   - Complete theme customization interface
   - Theme mode selection (light/dark)
   - Color scheme picker
   - Typography settings (font size, border radius)
   - Animated modal with overlay

6. **SettingsButton** (`src/shared/components/common/settings-button/settings-button.tsx`)

   - Floating settings button
   - Opens the settings modal
   - Consistent styling with theme toggle

7. **ThemeWrapper** (`src/shared/components/theme-wrapper/theme-wrapper.tsx`)
   - Global wrapper component
   - Provides floating buttons on all pages
   - Configurable button visibility

## Color Schemes

The system includes 20 predefined color schemes:

- **Blue** (default)
- **Red**
- **Green**
- **Purple**
- **Orange**
- **Indigo**
- **Pink**
- **Teal**
- **Cyan**
- **Emerald**
- **Violet**
- **Fuchsia**
- **Rose**
- **Amber**
- **Lime**
- **Sky**
- **Slate**
- **Zinc**
- **Neutral**
- **Stone**

Each color scheme provides a complete palette with 9 shades (50-900) for both primary and secondary colors.

## CSS Variables

The system uses CSS custom properties for dynamic theming:

```css
:root {
  /* Primary colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  /* ... up to 900 */

  /* Secondary colors */
  --color-secondary-50: #f8fafc;
  --color-secondary-100: #f1f5f9;
  /* ... up to 900 */

  /* Base settings */
  --base-font-size: 16px;
  --border-radius-base: 8px;

  /* Legacy compatibility */
  --primary-color: var(--color-primary-500);
  --secondary-color: var(--color-secondary-500);
}
```

Dark mode variables are applied when the `.dark` class is present on the document root.

## Usage

### Basic Theme Access

```tsx
import { useTheme } from "../shared/contexts/theme-context";

const MyComponent = () => {
  const { config, setTheme, setColorScheme } = useTheme();

  return (
    <div className={`bg-${config.theme === "dark" ? "gray-800" : "white"}`}>
      <p>Current theme: {config.theme}</p>
      <p>Color scheme: {config.colorScheme}</p>
    </div>
  );
};
```

### Theme-Aware Styling

Use Tailwind's dark mode classes for theme-aware styling:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <h1 className="text-primary-500 dark:text-primary-400">Title</h1>
</div>
```

### Adding Theme Controls

The floating theme controls are automatically available on all pages through the `ThemeWrapper` component in the root layout.

## Configuration Options

### UIConfig Interface

```typescript
interface UIConfig {
  menuLayout: "vertical" | "horizontal";
  menuStyle: "sidebar" | "topbar";
  theme: "light" | "dark";
  colorScheme: "blue" | "green" | "purple" | /* ... 17 more */;
  fontSize: "small" | "medium" | "large";
  borderRadius: "none" | "small" | "medium" | "large";
  enableAnimations: boolean;
  enableSearch: boolean;
  enableNotifications: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}
```

### Default Configuration

```typescript
const DEFAULT_UI_CONFIG: UIConfig = {
  menuLayout: "vertical",
  menuStyle: "sidebar",
  theme: "dark",
  colorScheme: "blue",
  fontSize: "medium",
  borderRadius: "medium",
  enableAnimations: true,
  enableSearch: true,
  enableNotifications: true,
};
```

## Implementation Details

### Theme Application

The `ThemeApplicationService` applies theme changes by:

1. **Dark Mode**: Adding/removing the `dark` class on `document.documentElement`
2. **Color Scheme**: Updating CSS custom properties for primary and secondary colors
3. **Typography**: Setting font size and border radius variables
4. **Legacy Support**: Maintaining backward compatibility with existing CSS variables

### Persistence

Theme preferences are automatically saved to `localStorage` with the key `ui-config` and restored on app initialization.

### Performance

- Theme changes are applied immediately without page reload
- CSS custom properties provide efficient runtime theming
- Minimal re-renders through optimized React context usage

## Accessibility

- All theme controls include proper ARIA labels
- Keyboard navigation support
- High contrast color schemes available
- Screen reader friendly

## Browser Support

- Modern browsers with CSS custom properties support
- Fallback to default theme for unsupported browsers
- Progressive enhancement approach

## Migration from Angular

The Next.js implementation maintains API compatibility with the Angular version:

- Same color schemes and naming conventions
- Identical configuration interface
- Similar component structure and behavior
- Consistent user experience across frameworks

## Future Enhancements

Potential improvements for the theme system:

1. **Custom Color Schemes**: User-defined color palettes
2. **Theme Presets**: Pre-configured theme combinations
3. **Animation Preferences**: Granular animation controls
4. **Accessibility Themes**: High contrast and reduced motion options
5. **Theme Sharing**: Export/import theme configurations
6. **System Theme Detection**: Automatic light/dark mode based on OS preference

## Troubleshooting

### Common Issues

1. **Theme not applying**: Check if `ThemeProvider` wraps your app
2. **Colors not updating**: Verify CSS custom properties are being set
3. **Dark mode not working**: Ensure Tailwind's dark mode is configured
4. **Settings modal not opening**: Check if `ThemeWrapper` is included in layout

### Debug Mode

Enable debug logging by adding to your component:

```tsx
const { config } = useTheme();
console.log("Current theme config:", config);
```

This will help identify configuration issues and theme state problems.
