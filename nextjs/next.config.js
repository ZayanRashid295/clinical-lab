/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  experimental: {
    // Enable app directory
    appDir: true,
  },
};

module.exports = nextConfig;
