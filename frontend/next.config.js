/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Disabled to prevent double API calls in development
    swcMinify: true,

    // Enable standalone output for production Docker builds
    output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

    // API proxy to backend
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/:path*',
            },
        ];
    },

    // Image optimization
    images: {
        domains: ['localhost'],
        formats: ['image/avif', 'image/webp'],
    },

    // Environment variables
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000',
    },
};

module.exports = nextConfig;
