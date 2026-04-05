import type { NextConfig } from "next";
import os from "node:os";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

// Turbopack can fail when the project path contains spaces. Only then use a temp dist dir
// (cross-platform). Otherwise keep `.next` next to the app — a Unix-style `/tmp/...` distDir
// on Windows breaks dev chunk loading ("module factory is not available").
const projectPathHasSpaces = process.cwd().includes(" ");
const distDir =
  process.env.VERCEL
    ? ".next"
    : projectPathHasSpaces
      ? path.join(os.tmpdir(), "data4research-next")
      : ".next";

const nextConfig: NextConfig = {
  distDir,
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
