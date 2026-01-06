import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {protocol: "http", hostname: "localhost", pathname: "/**"},
            {protocol: "https", hostname: "localhost", pathname: "/**"},
            {protocol: "http", hostname: "127.0.0.1", pathname: "/**"},
            {protocol: "https", hostname: "127.0.0.1", pathname: "/**"},
            {protocol: "https", hostname: "api.ticktime.media", pathname: "/**"},
            {protocol: "https", hostname: "ticktime.media", pathname: "/**"},
            {protocol: "https", hostname: "*.ticktime.media", pathname: "/**"},
        ],
        unoptimized: process.env.NODE_ENV === 'development',
        // Modern image formats for better compression and performance
        formats: ['image/avif', 'image/webp'],
        // Device sizes for responsive images
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        // Image sizes for different use cases
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    output: 'standalone',
    
    // Enable compression for production builds
    compress: true,
    
    // Experimental features for better performance
    experimental: {
        optimizeCss: true, // CSS optimization and minification
    },

    // Add HTTP headers for better caching and performance
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                ],
            },
            {
                source: '/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },

    webpack: (config, {dev, isServer}) => {
        if (dev && !isServer) {
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
            };
        }

        // Optimize bundle size for production
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                // Deterministic module IDs for better caching
                moduleIds: 'deterministic',
                // Split runtime into separate chunk for better caching
                runtimeChunk: 'single',
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        // Separate vendor chunks for better caching
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            priority: 10,
                            reuseExistingChunk: true,
                        },
                        // Separate common chunks
                        common: {
                            minChunks: 2,
                            priority: 5,
                            reuseExistingChunk: true,
                        },
                    },
                },
            };
        }

        return config;
    },

    turbopack: {},
};

export default nextConfig;
