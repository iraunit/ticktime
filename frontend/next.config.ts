import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure consistent port usage
  devIndicators: {
    buildActivity: true,
  },
  
  // Optimize for hydration
  experimental: {
    // Enable modern React features
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Handle hydration warnings
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Optimize CSS loading
  optimizeFonts: true,
  
  // Enable SWC minification
  swcMinify: true,
  
  // Handle static assets
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Webpack configuration for better hydration
  webpack: (config, { dev, isServer }) => {
    // Optimize for development
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
