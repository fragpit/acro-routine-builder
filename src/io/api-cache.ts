import { STORAGE_KEYS } from '../store/storage-keys';

/**
 * Tiny localStorage-backed GET cache for JSON endpoints.
 *
 * Stores all entries under a single key (STORAGE_KEYS.awtApiCache) as a
 * URL → { fetchedAt, payload } map. Entries are keyed by full URL, so
 * different query strings don't collide.
 *
 * Falls back gracefully when localStorage is unavailable (Safari private
 * mode, quota exceeded, SSR): the cache just becomes a no-op and every
 * call hits the network.
 */

interface CacheEntry<T> {
  fetchedAt: number;
  payload: T;
}

type CacheMap = Record<string, CacheEntry<unknown>>;

function readCache(): CacheMap {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.awtApiCache);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as CacheMap) : {};
  } catch {
    return {};
  }
}

function writeCache(map: CacheMap): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.awtApiCache, JSON.stringify(map));
  } catch {
    // Quota exceeded or serialisation failure - drop the whole cache so
    // the next write has a clean slate. Better than leaving a corrupted
    // partial entry behind.
    try {
      localStorage.removeItem(STORAGE_KEYS.awtApiCache);
    } catch {
      // Give up silently.
    }
  }
}

export interface CachedFetchOptions<T> {
  /** How long a cached value is considered fresh, in milliseconds. */
  ttlMs: number;
  /**
   * Optional predicate to decide whether the freshly fetched value is
   * worth caching (e.g. skip caching in-progress competitions whose
   * results may still change). Called after a successful network fetch.
   */
  shouldCache?: (payload: T) => boolean;
}

/**
 * GET `url` with JSON parsing, returning a cached payload if it's still
 * fresh. On a cache miss / expired entry, falls back to the provided
 * `fetcher` and writes the result to the cache (subject to `shouldCache`).
 */
export async function cachedJson<T>(
  url: string,
  fetcher: (url: string) => Promise<T>,
  options: CachedFetchOptions<T>,
): Promise<T> {
  const now = Date.now();
  const cache = readCache();
  const hit = cache[url] as CacheEntry<T> | undefined;
  if (hit && now - hit.fetchedAt < options.ttlMs) {
    return hit.payload;
  }
  const payload = await fetcher(url);
  if (!options.shouldCache || options.shouldCache(payload)) {
    cache[url] = { fetchedAt: now, payload };
    writeCache(cache);
  }
  return payload;
}

/** Clear every cached AWT API response. Useful for "refresh" actions. */
export function clearApiCache(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.awtApiCache);
  } catch {
    // Nothing we can do; ignore.
  }
}
