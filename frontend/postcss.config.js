module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
        // Production optimizations while preserving custom CSS
        ...(process.env.NODE_ENV === 'production' ? {
            // Note: cssnano is typically included by Next.js in production
            // This ensures our custom keyframes and classes are preserved
        } : {}),
    },
}