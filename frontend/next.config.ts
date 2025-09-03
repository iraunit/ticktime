import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', '127.0.0.1', 'api.ticktime.media', 'ticktime.media'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Enable standalone output for Docker optimization
  output: 'standalone',

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },
};

export default nextConfig;
