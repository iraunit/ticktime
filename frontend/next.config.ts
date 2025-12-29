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
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60,
    },

    output: 'standalone',

    // Performance optimizations
    compress: true,
    poweredByHeader: false,
    
    // Experimental features for better performance
    experimental: {
        optimizeCss: true,
        optimizePackageImports: ['@radix-ui/react-icons', 'react-icons', 'lucide-react'],
    },

    // Headers for caching and performance
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    }
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
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400, stale-while-revalidate=604800',
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

        // Optimize bundle size
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                moduleIds: 'deterministic',
                runtimeChunk: 'single',
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            priority: 10,
                            reuseExistingChunk: true,
                        },
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
