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
    },

    output: 'standalone',

    webpack: (config, {dev, isServer}) => {
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
