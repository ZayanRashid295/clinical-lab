# Multilingual System Documentation

This document describes the comprehensive multilingual (i18n) system implemented in the Next.js application using next-intl and best practices.

## Overview

The multilingual system provides:

- **8 Language Support**: English, Arabic, Spanish, French, German, Chinese, Japanese, Korean
- **RTL Support**: Complete Right-to-Left support for Arabic
- **Dynamic Language Switching**: Real-time language switching without page reload
- **Floating Language Switcher**: Always-accessible language selection
- **Comprehensive Translations**: All UI elements, messages, and content translated
- **SEO-Friendly URLs**: Language-specific routing with locale prefixes
- **Type Safety**: Full TypeScript support for translations

## Architecture

### Core Components

1. **i18n Configuration** (`src/shared/config/i18n.ts`)

   - Locale definitions and configuration
   - RTL/LTR direction detection
   - Locale metadata (flags, native names)
   - Next-intl configuration

2. **Language Context** (`src/shared/contexts/language-context.tsx`)

   - Language state management
   - RTL detection and context
   - Language switching functionality

3. **Language Switcher** (`src/shared/components/language-switcher/language-switcher.tsx`)

   - Floating language selection component
   - Dropdown with all available languages
   - Flag icons and native language names
   - Configurable positioning

4. **Middleware** (`src/middleware.ts`)

   - Locale routing and URL handling
   - Automatic locale detection
   - SEO-friendly URL structure

5. **Locale Files** (`src/locale/`)
   - JSON files for each supported language
   - Structured translation keys
   - Comprehensive coverage of all UI elements

## Supported Languages

| Language | Code | Native Name | Flag | Direction |
| -------- | ---- | ----------- | ---- | --------- |
| English  | `en` | English     | 🇺🇸   | LTR       |
| Arabic   | `ar` | العربية     | 🇸🇦   | RTL       |
| Spanish  | `es` | Español     | 🇪🇸   | LTR       |
| French   | `fr` | Français    | 🇫🇷   | LTR       |
| German   | `de` | Deutsch     | 🇩🇪   | LTR       |
| Chinese  | `zh` | 中文        | 🇨🇳   | LTR       |
| Japanese | `ja` | 日本語      | 🇯🇵   | LTR       |
| Korean   | `ko` | 한국어      | 🇰🇷   | LTR       |

## URL Structure

The system uses locale-prefixed URLs for SEO and user experience:

```
http://localhost:3001/en/login     # English
http://localhost:3001/ar/login     # Arabic
http://localhost:3001/es/login     # Spanish
http://localhost:3001/fr/login     # French
http://localhost:3001/de/login     # German
http://localhost:3001/zh/login     # Chinese
http://localhost:3001/ja/login     # Japanese
http://localhost:3001/ko/login     # Korean
```

## Translation Structure

### Locale File Organization

```json
{
  "common": {
    "login": "Login",
    "logout": "Logout",
    "settings": "Settings",
    "theme": "Theme",
    "language": "Language"
  },
  "app": {
    "title": "RideShare Pro",
    "tagline": "Revolutionizing Urban Mobility",
    "description": "Experience the future...",
    "features": {
      "gpsTracking": "Real-time GPS tracking...",
      "securePayments": "Secure payment processing...",
      "analytics": "Advanced analytics..."
    }
  },
  "errors": {
    "generic": "Something went wrong...",
    "network": "Network error...",
    "unauthorized": "You are not authorized..."
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email...",
    "minLength": "Must be at least {min} characters"
  }
}
```

## Usage

### Basic Translation Usage

```tsx
import { useTranslations } from "next-intl";

const MyComponent = () => {
  const t = useTranslations();

  return (
    <div>
      <h1>{t("app.title")}</h1>
      <p>{t("app.description")}</p>
      <button>{t("common.login")}</button>
    </div>
  );
};
```

### Language Context Usage

```tsx
import { useLanguage } from "../contexts/language-context";

const MyComponent = () => {
  const { currentLocale, isRTL, localeInfo } = useLanguage();

  return (
    <div className={isRTL ? "rtl" : "ltr"}>
      <p>Current language: {localeInfo.nativeName}</p>
      <p>Direction: {isRTL ? "RTL" : "LTR"}</p>
    </div>
  );
};
```

### RTL Support

```tsx
const { isRTL } = useLanguage();

return (
  <div className={`container ${isRTL ? "rtl" : "ltr"}`}>
    <div
      className="flex"
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
      }}
    >
      <span>Icon</span>
      <span>Text</span>
    </div>
  </div>
);
```

## RTL (Right-to-Left) Support

### CSS Classes

The system provides comprehensive RTL support through CSS classes:

```css
.rtl {
  direction: rtl;
  text-align: right;
}

.ltr {
  direction: ltr;
  text-align: left;
}

/* RTL-specific adjustments */
.rtl .flex {
  flex-direction: row-reverse;
}

.rtl .space-x-3 > * + * {
  margin-left: 0;
  margin-right: 0.75rem;
}

.rtl input {
  text-align: right;
}
```

### Automatic RTL Detection

```tsx
const { isRTL } = useLanguage();

// Automatically applies RTL styles
<div className={isRTL ? "rtl" : "ltr"}>
  {/* Content automatically adjusts for RTL */}
</div>;
```

## Language Switcher

### Floating Language Switcher

The language switcher is automatically available on all pages:

```tsx
<LanguageSwitcher floating={true} position="bottom-right" />
```

### Features

- **Flag Icons**: Visual representation of each language
- **Native Names**: Display in the language's native script
- **Current Selection**: Visual indicator of active language
- **Smooth Transitions**: Animated dropdown with backdrop
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Configuration

### Next.js Configuration

```javascript
// next.config.js
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/shared/config/i18n.ts");

module.exports = withNextIntl(nextConfig);
```

### Middleware Configuration

```typescript
// src/middleware.ts
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "ar", "es", "fr", "de", "zh", "ja", "ko"],
  defaultLocale: "en",
  localePrefix: "always",
});
```

## Adding New Languages

### 1. Update Configuration

```typescript
// src/shared/config/i18n.ts
export const locales = [
  "en",
  "ar",
  "es",
  "fr",
  "de",
  "zh",
  "ja",
  "ko",
  "it",
] as const;

export const localeConfig = {
  // ... existing locales
  it: {
    name: "Italian",
    nativeName: "Italiano",
    direction: "ltr",
    flag: "🇮🇹",
  },
};
```

### 2. Create Locale File

```json
// src/locale/it.json
{
  "common": {
    "login": "Accedi",
    "logout": "Esci",
    "settings": "Impostazioni"
  }
}
```

### 3. Update Middleware

```typescript
// src/middleware.ts
export const config = {
  matcher: ["/", "/(ar|en|es|fr|de|zh|ja|ko|it)/:path*"],
};
```

## Best Practices

### Translation Keys

- Use descriptive, hierarchical keys: `app.features.gpsTracking`
- Group related translations: `common.*`, `errors.*`, `validation.*`
- Use consistent naming conventions
- Avoid deep nesting (max 3-4 levels)

### RTL Considerations

- Test all layouts in RTL mode
- Use logical properties when possible
- Consider icon direction and positioning
- Test form layouts and input alignment

### Performance

- Lazy load locale files
- Use dynamic imports for large translation files
- Implement proper caching strategies
- Minimize bundle size with tree shaking

## Integration with Theme System

The multilingual system integrates seamlessly with the theme system:

- **Floating Controls**: Language switcher positioned alongside theme controls
- **Consistent Styling**: Matches theme colors and styling
- **RTL Theme Support**: Theme components adapt to RTL layouts
- **Settings Integration**: Language preferences saved with theme settings

## Accessibility

- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Works with high contrast themes
- **Focus Management**: Proper focus handling in dropdowns

## SEO Benefits

- **Locale-Specific URLs**: Search engines can index language-specific content
- **Hreflang Support**: Proper language targeting for search engines
- **Structured Data**: Language-specific structured data
- **Performance**: Fast language switching without full page reloads

## Testing

### Manual Testing

1. **Language Switching**: Test all language switches
2. **RTL Layout**: Verify Arabic layout and text direction
3. **URL Structure**: Check locale-prefixed URLs
4. **Persistence**: Verify language selection persists across sessions
5. **Fallbacks**: Test fallback to default language

### Automated Testing

```typescript
// Example test for language switching
test("should switch language correctly", () => {
  render(<LanguageSwitcher />);

  fireEvent.click(screen.getByRole("button"));
  fireEvent.click(screen.getByText("العربية"));

  expect(window.location.pathname).toContain("/ar/");
});
```

## Troubleshooting

### Common Issues

1. **Missing Translations**: Check locale file structure and keys
2. **RTL Layout Issues**: Verify CSS classes and flexbox properties
3. **URL Routing**: Check middleware configuration
4. **Performance**: Monitor bundle size and loading times

### Debug Mode

```typescript
// Enable debug logging
const t = useTranslations();
console.log("Current translations:", t.raw("common"));
```

## Future Enhancements

- **Pluralization**: Advanced pluralization rules
- **Date/Number Formatting**: Locale-specific formatting
- **Dynamic Loading**: Load translations on demand
- **Translation Management**: Integration with translation services
- **Voice Support**: Text-to-speech in different languages
- **Auto-Detection**: Browser language auto-detection
