/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Solana wallet adapter compatibility
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@farcaster/mini-app-solana": false,
      "@farcaster/miniapp-sdk": false,
    };
    return config;
  },
};

module.exports = nextConfig;
