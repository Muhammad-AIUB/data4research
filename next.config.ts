import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Workaround: Turbopack cannot write build artifacts when project path contains spaces.
  // On Vercel, use the default .next so the platform can locate routes-manifest.json.
  distDir: process.env.VERCEL ? '.next' : '/tmp/data4research-next',
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
    ]
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry CLI logs during build
  silent: true,
  // Route browser requests through Next.js to bypass ad blockers
  tunnelRoute: "/monitoring",
  // Disable source map deletion so Vercel can still use them
  sourcemaps: {
    deleteSourcemapsAfterUpload: false,
  },
});
