import IORedis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

/**
 * Minimal Redis surface used by this app (works with ioredis TCP or Upstash REST).
 * Precedence: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN → @upstash/redis,
 * else REDIS_URL → ioredis.
 */
export interface D4RRedis {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  pexpire(key: string, milliseconds: number): Promise<number>;
  pttl(key: string): Promise<number>;
  lpush(key: string, value: string): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<unknown>;
  rpop(key: string): Promise<string | null>;
  pipeline(): D4RPipeline;
}

export interface D4RPipeline {
  incr(key: string): void;
  expire(key: string, seconds: number): void;
  exec(): Promise<unknown>;
}

const g = globalThis as unknown as {
  __d4rRedis?: D4RRedis | null;
};

function wrapIoredis(r: IORedis): D4RRedis {
  return {
    get: (k) => r.get(k),
    setex: (k, sec, v) => r.setex(k, sec, v),
    incr: (k) => r.incr(k),
    pexpire: (k, ms) => r.pexpire(k, ms),
    pttl: (k) => r.pttl(k),
    lpush: (k, v) => r.lpush(k, v),
    ltrim: (k, start, stop) => r.ltrim(k, start, stop),
    rpop: (k) => r.rpop(k),
    pipeline: () => {
      const p = r.pipeline();
      return {
        incr: (key) => {
          p.incr(key);
        },
        expire: (key, sec) => {
          p.expire(key, sec);
        },
        exec: () => p.exec(),
      };
    },
  };
}

function wrapUpstash(r: UpstashRedis): D4RRedis {
  return {
    get: (k) => r.get<string | null>(k),
    setex: (k, sec, v) => r.set(k, v, { ex: sec }),
    incr: (k) => r.incr(k),
    pexpire: (k, ms) => r.pexpire(k, ms),
    pttl: (k) => r.pttl(k),
    lpush: (k, v) => r.lpush(k, v),
    ltrim: (k, start, stop) => r.ltrim(k, start, stop),
    rpop: (k) => r.rpop<string | null>(k),
    pipeline: () => {
      const p = r.pipeline();
      return {
        incr: (key) => {
          p.incr(key);
        },
        expire: (key, sec) => {
          p.expire(key, sec);
        },
        exec: () => p.exec(),
      };
    },
  };
}

/**
 * Singleton Redis client when Upstash REST or REDIS_URL is set; `null` disables Redis features.
 * Connection/setup errors mark client unavailable for the process lifetime.
 */
export function getRedis(): D4RRedis | null {
  const upUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const tcpUrl = process.env.REDIS_URL?.trim();

  if (!upUrl && !upToken && !tcpUrl) {
    return null;
  }

  if (g.__d4rRedis === null) return null;
  if (g.__d4rRedis) return g.__d4rRedis;

  if (upUrl && upToken) {
    try {
      g.__d4rRedis = wrapUpstash(new UpstashRedis({ url: upUrl, token: upToken }));
      return g.__d4rRedis;
    } catch {
      g.__d4rRedis = null;
      return null;
    }
  }

  if (!tcpUrl) {
    return null;
  }

  try {
    const r = new IORedis(tcpUrl, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    r.on("error", (err) => {
      console.error(
        JSON.stringify({
          level: "ERROR",
          message: "Redis client error",
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    });
    g.__d4rRedis = wrapIoredis(r);
    return g.__d4rRedis;
  } catch {
    g.__d4rRedis = null;
    return null;
  }
}
