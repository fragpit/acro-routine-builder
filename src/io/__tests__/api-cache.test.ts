import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedJson, clearApiCache } from '../api-cache';
import { STORAGE_KEYS } from '../../store/storage-keys';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('cachedJson', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the fetched value on cache miss and stores it', async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    const result = await cachedJson('https://x/a', fetcher, { ttlMs: 1000 });
    expect(result).toEqual({ value: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.awtApiCache) ?? '{}');
    expect(stored['https://x/a']?.payload).toEqual({ value: 1 });
  });

  it('returns the cached value on a warm hit without calling the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ value: 1 });
    await cachedJson('https://x/a', fetcher, { ttlMs: 60_000 });
    fetcher.mockClear();
    const result = await cachedJson('https://x/a', fetcher, { ttlMs: 60_000 });
    expect(result).toEqual({ value: 1 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('refetches when the cache entry is older than ttlMs', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ v: 'old' })
      .mockResolvedValueOnce({ v: 'new' });
    vi.useFakeTimers();
    vi.setSystemTime(0);
    await cachedJson('https://x/a', fetcher, { ttlMs: 1000 });
    vi.setSystemTime(5000);
    const result = await cachedJson('https://x/a', fetcher, { ttlMs: 1000 });
    expect(result).toEqual({ v: 'new' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('keeps different URLs in separate slots', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(async (url: string) => ({ echoed: url }));
    const a = await cachedJson('https://x/a', fetcher, { ttlMs: 60_000 });
    const b = await cachedJson('https://x/b', fetcher, { ttlMs: 60_000 });
    expect(a).toEqual({ echoed: 'https://x/a' });
    expect(b).toEqual({ echoed: 'https://x/b' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('skips caching when shouldCache returns false', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ state: 'open' })
      .mockResolvedValueOnce({ state: 'open' });
    await cachedJson('https://x/a', fetcher, {
      ttlMs: 60_000,
      shouldCache: (c: { state: string }) => c.state === 'closed',
    });
    await cachedJson('https://x/a', fetcher, {
      ttlMs: 60_000,
      shouldCache: (c: { state: string }) => c.state === 'closed',
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('clearApiCache removes every entry', async () => {
    const fetcher = vi.fn().mockResolvedValue({ v: 1 });
    await cachedJson('https://x/a', fetcher, { ttlMs: 60_000 });
    expect(localStorage.getItem(STORAGE_KEYS.awtApiCache)).not.toBeNull();
    clearApiCache();
    expect(localStorage.getItem(STORAGE_KEYS.awtApiCache)).toBeNull();
  });

  it('falls back to a network call when localStorage throws', async () => {
    const throwing: Storage = {
      length: 0,
      clear: () => {},
      getItem: () => {
        throw new Error('denied');
      },
      key: () => null,
      removeItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    vi.stubGlobal('localStorage', throwing);
    const fetcher = vi.fn().mockResolvedValue({ v: 'net' });
    const result = await cachedJson('https://x/a', fetcher, { ttlMs: 60_000 });
    expect(result).toEqual({ v: 'net' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
