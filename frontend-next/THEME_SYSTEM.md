# Theme System Documentation

## Overview

The Next.js frontend now includes a comprehensive theme system that allows users to customize the appearance of the application. The theme system supports:

- **Theme Modes**: Light, Dark, and Auto (follows system preference)
- **Color Schemes**: 8 different color palettes (Blue, Green, Purple, Red, Orange, Indigo, Pink, Teal)
- **Font Sizes**: Small, Medium, Large
- **Border Radius**: None, Small, Medium, Large
- **Real-time Preview**: See changes immediately as you customize

## Features

### 1. Theme Modes

- **Light**: Always use light theme with consistent color palettes
- **Dark**: Always use dark theme with consistent color palettes (only backgrounds and text change)

### 2. Color Schemes

The system includes 8 predefined color schemes:

**Color Consistency**: The actual colors (red, blue, green, etc.) remain exactly the same whether you're in light or dark mode. Only the backgrounds, text colors, and borders change to provide proper contrast and readability.

- Blue (default)
- Green
- Purple
- Red
- Orange
- Indigo
- Pink
- Teal

Each color scheme includes a full palette from 50-900 shades for both primary and secondary colors.

### 3. Typography

- **Small**: Compact text (14px base)
- **Medium**: Standard text (16px base)
- **Large**: Larger text (18px base)

### 4. Border Radius

- **None**: Sharp corners (0px)
- **Small**: Slightly rounded (0.25rem)
- **Medium**: Moderately rounded (0.5rem)
- **Large**: Very rounded (1rem)

## Usage

### Accessing Theme Settings

1. **Quick Color Picker**: Click the palette icon (🎨) in the header or bottom-right corner for instant color theme switching
2. **Quick Theme Toggle**: Use the theme toggle button (☀️/🌙) next to the settings button
3. **Via Settings Panel**: Click the settings gear icon (⚙️) in the bottom-right corner
4. **Via System Settings**: Navigate to Admin → Settings → Themes tab

### Quick Color Picker

The color picker provides instant access to all 8 color themes:

- **Header Color Picker**: Shows current theme name and color swatches
- **Floating Color Picker**: Compact palette icon in bottom-right corner, opens upward to stay within viewport
- **One-Click Switching**: Click any color to instantly apply the theme
- **Visual Preview**: See color swatches before applying

### Theme Toggle Button

The theme toggle button toggles between theme modes:

- Sun icon: Light theme
- Moon icon: Dark theme

## Technical Implementation

### Core Files

- `src/app/config/ui.config.ts` - UI configuration service
- `src/app/config/theme.service.ts` - Theme management service
- `src/shared/contexts/UIConfigContext.tsx` - React context for theme state
- `src/hooks/useTheme.ts` - Custom hook for theme management
- `src/shared/components/ThemeToggle.tsx` - Theme toggle component
- `src/shared/components/ColorPicker.tsx` - Floating color picker component
- `src/shared/components/HeaderColorPicker.tsx` - Header color picker component
- `src/styles/theme.css` - CSS custom properties and theme styles

### CSS Custom Properties

The theme system uses CSS custom properties for dynamic theming:

```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  /* ... more color variables */
  --base-font-size: 16px;
  --base-border-radius: 0.5rem;
}
```

### Tailwind Integration

The Tailwind config has been updated to support:

- Dark mode with class strategy
- Custom color variables
- Dynamic font sizes and border radius

### State Management

Theme preferences are:

- Stored in localStorage
- Persisted across sessions
- Applied immediately on change
- Synchronized across all components

## Customization

### Adding New Color Schemes

1. Add the color scheme to `COLOR_SCHEMES` in `theme.service.ts`
2. Update the `UIConfig` interface if needed
3. The new scheme will automatically appear in the UI

### Adding New Theme Options

1. Update the `UIConfig` interface in `ui.config.ts`
2. Add the new option to `DEFAULT_UI_CONFIG`
3. Implement the setter method in `UIConfigService`
4. Update the context and hook
5. Add UI controls in the theme settings

### Using Theme in Components

```tsx
import { useTheme } from "../hooks/useTheme";

function MyComponent() {
  const { config } = useTheme();

  return (
    <div className="bg-primary-500 text-white">
      Current theme: {config.theme}
    </div>
  );
}
```

## Browser Support

- Modern browsers with CSS custom properties support
- Automatic fallback to default theme for unsupported browsers
- Responsive design works across all screen sizes

## Performance

- Themes are applied via CSS custom properties (no re-renders)
- Minimal JavaScript overhead
- Efficient localStorage usage
- Smooth transitions between themes

## Future Enhancements

Potential future improvements:

- Custom color picker
- Theme import/export
- More granular customization options
- Animation preferences
- High contrast mode
- Reduced motion support
