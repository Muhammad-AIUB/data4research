// ====================================================
// IN-MEMORY RATE LIMITER — Write endpoints only
// ====================================================
// Sliding-window counter scoped per userId.
// No Redis or external dependencies — suitable for single-instance deployments.
// For multi-instance, swap to Redis or edge KV.
//
// IMPORTANT: This store lives in server process memory.
// It resets on server restart, which is acceptable for a
// regulated app where restarts are infrequent.

import { NextResponse } from "next/server";

interface TokenBucket {
  count: number;
  resetAt: number; // epoch ms
}

// userId → bucket
const buckets = new Map<string, TokenBucket>();

// Limits: 30 write requests per 60-second window per user
const MAX_REQUESTS = 30;
const WINDOW_MS = 60_000;

// Periodic cleanup to prevent memory leaks from expired buckets
const CLEANUP_INTERVAL_MS = 5 * 60_000; // every 5 minutes
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

/**
 * Check rate limit for a write operation.
 * Returns null if allowed, or a 429 NextResponse if exceeded.
 */
export function checkRateLimit(userId: string): NextResponse | null {
  cleanupExpired();

  const now = Date.now();
  const bucket = buckets.get(userId);

  if (!bucket || now > bucket.resetAt) {
    // New window
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }

  bucket.count++;
  return null;
}
