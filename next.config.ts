/* eslint-disable @typescript-eslint/no-require-imports */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Enable PWA only in production
});

const nextConfig = withPWA({
  reactStrictMode: true,
});

export default nextConfig;
