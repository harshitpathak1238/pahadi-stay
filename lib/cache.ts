import type Redis from 'ioredis';

// Shared cache for public catalogue reads (listings, rides, packages, blogs).
//
// Redis is optional on purpose: local dev, CI and any host without a Redis
// instance must not crash. If REDIS_URL is missing or the server is
// unreachable we transparently fall back to a per-process Map, which still
// removes duplicate work within a single instance.
//
// Every call is wrapped so a Redis failure degrades to "no cache" rather than
// propagating — a slow cache must never take the site down.

type Entry = { value: unknown; expiresAt: number };

const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

const REDIS_URL = process.env.REDIS_URL;
const PREFIX = process.env.REDIS_PREFIX || 'pstay';

// ioredis depends on Node built-ins (`dns`, `net`, `tls`) which webpack cannot
// resolve for the browser bundle. Some shared modules import the data helpers,
// so the client is loaded through a runtime-only dynamic import to keep
// ioredis out of client-side chunks entirely.
type RedisClient = InstanceType<typeof Redis>;
let clientPromise: Promise<RedisClient | null> | null = null;
let redisBroken = false;
let warned = false;

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[cache] ${message}`);
}

function connect(): Promise<RedisClient | null> {
  if (!REDIS_URL || redisBroken) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('ioredis')
      .then(({ default: RedisCtor }) => {
        const instance: RedisClient = new RedisCtor(REDIS_URL, {
          // Fail fast: a dead cache should never stall a page render.
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 2000,
          lazyConnect: false,
        });
        instance.on('error', (error: Error) => {
          warnOnce(`Redis unavailable, using in-memory cache (${error.message})`);
          redisBroken = true;
        });
        return instance;
      })
      .catch((error: unknown) => {
        redisBroken = true;
        warnOnce(`Redis init failed, using in-memory cache (${error instanceof Error ? error.message : 'unknown'})`);
        return null;
      });
  }
  return clientPromise;
}

/**
 * Resolve the Redis client, but only on the server. Returns null in the
 * browser so client components never open a socket.
 */
async function getClient(): Promise<RedisClient | null> {
  if (typeof window !== 'undefined') return null;
  return connect();
}

function keyFor(key: string) {
  return `${PREFIX}:${key}`;
}

export const cacheStats = { redis: false, memoryHits: 0, memoryMisses: 0, redisHits: 0, redisMisses: 0 };

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getClient();
  if (redis) {
    try {
      const raw = await redis.get(keyFor(key));
      if (raw == null) {
        cacheStats.redisMisses += 1;
        return null;
      }
      cacheStats.redisHits += 1;
      return JSON.parse(raw) as T;
    } catch {
      // Treat any Redis problem as a miss.
    }
  }
  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    cacheStats.memoryHits += 1;
    return hit.value as T;
  }
  memory.delete(key);
  cacheStats.memoryMisses += 1;
  return null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memory.set(key, { value, expiresAt });

  const redis = await getClient();
  if (redis) {
    try {
      await redis.set(keyFor(key), JSON.stringify(value), 'EX', ttlSeconds);
      cacheStats.redis = true;
    } catch {
      // Memory copy already stored.
    }
  }
}

export async function cacheDelete(key: string) {
  memory.delete(key);
  const redis = await getClient();
  if (!redis) return;
  try {
    await redis.del(keyFor(key));
  } catch {
    /* best-effort */
  }
}

/**
 * Drop every key under a prefix. Uses SCAN rather than KEYS so a large
 * keyspace never blocks the Redis server.
 */
export async function cacheDeletePrefix(prefix: string) {
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
  const redis = await getClient();
  if (!redis) return;
  const match = `${PREFIX}:${prefix}*`;
  try {
    let cursor = '0';
    do {
      const [next, found] = await redis.scan(cursor, 'MATCH', match, 'COUNT', 200);
      cursor = next;
      if (found.length) await redis.del(...found);
    } while (cursor !== '0');
  } catch {
    /* best-effort */
  }
}

/**
 * Read-through cache with in-flight de-duplication: concurrent requests for
 * the same key share one database round-trip instead of stampeding it.
 */
export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null && hit !== undefined) return hit;

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = loader()
    .then(async (value) => {
      await cacheSet(key, value, ttlSeconds);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/** Test seam: wipe the in-process cache. */
export function __resetMemoryCache() {
  memory.clear();
  inflight.clear();
}