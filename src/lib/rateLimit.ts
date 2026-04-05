// Distributed write rate limit (Redis / Upstash REST) with in-memory fallback when Redis unset.

import { NextResponse } from "next/server";

import { getRedis } from "@/lib/redis";

const MAX_REQUESTS = 30;
const WINDOW_MS = 60_000;

interface TokenBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, TokenBucket>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60_000;

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

function checkRateLimitInMemory(userId: string): NextResponse | null {
  cleanupExpired();
  const now = Date.now();
  const bucket = buckets.get(userId);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  if (bucket.count >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  bucket.count++;
  return null;
}

export async function checkRateLimit(userId: string): Promise<NextResponse | null> {
  const r = getRedis();
  if (!r) {
    return checkRateLimitInMemory(userId);
  }
  const key = `d4r:rl:write:${userId}`;
  try {
    const n = await r.incr(key);
    if (n === 1) await r.pexpire(key, WINDOW_MS);
    if (n > MAX_REQUESTS) {
      const ttl = await r.pttl(key);
      const retryAfter = Math.max(1, Math.ceil((ttl > 0 ? ttl : WINDOW_MS) / 1000));
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
    return null;
  } catch {
    return checkRateLimitInMemory(userId);
  }
}
