const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
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
