const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Skip bundling the Gemini SDK into API route chunks (smaller graphs, faster dev compile). */
  serverExternalPackages: ["@google/generative-ai"],
  experimental: {
    /** Tree-shake icon / UI barrels so fewer modules compile per route. */
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-popover",
      "@radix-ui/react-tooltip",
      "recharts",
      "date-fns",
    ],
  },
  async redirects() {
    return [
      { source: "/login", destination: "/", permanent: true },
    ];
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  // Monorepo: Next detected yarn.lock at repo root (clinical-lab); align tracing with that root.
  outputFileTracingRoot: path.join(__dirname, ".."),
}

module.exports = nextConfig
