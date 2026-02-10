import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Reduce serverless cold starts
  serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg'],
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // HTTP response headers for caching
  async headers() {
    return [
      {
        source: '/api/options',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
};

export default nextConfig;
