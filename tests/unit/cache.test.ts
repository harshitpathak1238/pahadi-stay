import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadCache() {
  vi.resetModules();
  return import('@/lib/cache');
}

describe('cache', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  it('serves a stored value without calling the loader again', async () => {
    const { cached, __resetMemoryCache } = await loadCache();
    __resetMemoryCache();
    const loader = vi.fn(async () => ({ value: 42 }));
    expect(await cached('k', 60, loader)).toEqual({ value: 42 });
    expect(await cached('k', 60, loader)).toEqual({ value: 42 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('de-duplicates concurrent loads of the same key', async () => {
    const { cached, __resetMemoryCache } = await loadCache();
    __resetMemoryCache();
    const loader = vi.fn(async () => 'value');
    const [a, b, c] = await Promise.all([cached('same', 60, loader), cached('same', 60, loader), cached('same', 60, loader)]);
    expect([a, b, c]).toEqual(['value', 'value', 'value']);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('keeps separate keys isolated', async () => {
    const { cached, __resetMemoryCache } = await loadCache();
    __resetMemoryCache();
    expect(await cached('a', 60, async () => 1)).toBe(1);
    expect(await cached('b', 60, async () => 2)).toBe(2);
    expect(await cached('a', 60, async () => 99)).toBe(1);
  });

  it('deletes a single key', async () => {
    const { cached, cacheDelete, __resetMemoryCache } = await loadCache();
    __resetMemoryCache();
    await cached('gone', 60, async () => 'first');
    await cacheDelete('gone');
    expect(await cached('gone', 60, async () => 'second')).toBe('second');
  });

  it('deletes every key under a prefix and leaves others intact', async () => {
    const { cached, cacheDeletePrefix, __resetMemoryCache } = await loadCache();
    __resetMemoryCache();
    await cached('listings:STAY', 60, async () => 'stay');
    await cached('listings:RENTAL', 60, async () => 'rental');
    await cached('blogs:list', 60, async () => 'blogs');
    await cacheDeletePrefix('listings:');
    expect(await cached('listings:STAY', 60, async () => 'fresh')).toBe('fresh');
    expect(await cached('blogs:list', 60, async () => 'fresh')).toBe('blogs');
  });

  it('expires entries once the ttl has passed', async () => {
    vi.useFakeTimers();
    try {
      const { cached, __resetMemoryCache } = await loadCache();
      __resetMemoryCache();
      const loader = vi.fn(async () => 'fresh');
      await cached('ttl', 60, loader);
      vi.setSystemTime(Date.now() + 61_000);
      await cached('ttl', 60, loader);
      expect(loader).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('propagates loader errors and does not cache them', async () => {
    const { cached, __resetMemoryCache } = await loadCache();
    __resetMemoryCache();
    let attempts = 0;
    const loader = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('db down');
      return 'recovered';
    });
    await expect(cached('flaky', 60, loader)).rejects.toThrow('db down');
    await expect(cached('flaky', 60, loader)).resolves.toBe('recovered');
  });
});