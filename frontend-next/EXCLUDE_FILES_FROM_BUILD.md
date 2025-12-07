# How to Exclude Files from Next.js Build

## Method 1: Exclude from TypeScript Compilation (Recommended)

Edit `tsconfig.json`:

```json
{
  "exclude": [
    "node_modules",
    "improve-ui-design",
    "src/app/components/question-generator/rich-markdown-editor.tsx"  // Add files here
  ]
}
```

## Method 2: Use Next.js Config to Ignore Type Errors

Edit `next.config.js`:

```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // ⚠️ WARNING: This ignores ALL type errors
  },
  eslint: {
    ignoreDuringBuilds: true,  // ⚠️ WARNING: This ignores ALL ESLint errors
  },
}
```

## Method 3: Exclude via Webpack (Advanced)

Edit `next.config.js`:

```javascript
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude specific files from webpack processing
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      exclude: [
        /node_modules/,
        /improve-ui-design/,
        /path\/to\/file\.tsx$/  // Add specific file patterns
      ],
    })
    return config
  },
}
```

## Method 4: Use .gitignore (For Development Only)

Add to `.gitignore`:
```
improve-ui-design/
*.problematic-file.tsx
```

Note: This only prevents files from being committed, not from being built.

## Current Exclusions

- `improve-ui-design/` - Already excluded in `tsconfig.json`

## Recommendation

For production builds, it's better to **fix the errors** rather than exclude files, as excluded files won't be available in production. Use exclusions only for:
- Experimental/development code
- Legacy code that's being phased out
- Third-party code that can't be modified

