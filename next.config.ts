import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  compress: true,
  serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Optimize client-side JS
  experimental: {
    optimizePackageImports: ['lucide-react', 'swr', 'zod'],
  },
  async headers() {
    return [
      {
        source: '/api/options',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
};

export default nextConfig;
