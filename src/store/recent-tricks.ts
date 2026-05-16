import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import { STORAGE_KEYS } from './storage-keys';

export const MAX_RECENT_TRICKS = 10;

/**
 * Read the recent-tricks list from localStorage, dropping unknown or malformed ids.
 * Safe to call during SSR / missing storage - returns [] on any failure.
 */
export function loadRecentTricks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.recentTricks);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === 'string' && !!MANOEUVRES_BY_ID[x]);
  } catch {
    return [];
  }
}

/**
 * Persist the recent-tricks list. Silently swallows storage errors (quota / private mode).
 */
export function saveRecentTricks(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.recentTricks, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/**
 * Return a new list with `id` at the front, deduplicated, capped at MAX_RECENT_TRICKS.
 * Also persists the result so callers do not have to call saveRecentTricks themselves.
 */
export function pushRecentTrick(prev: string[], id: string): string[] {
  const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT_TRICKS);
  saveRecentTricks(next);
  return next;
}
