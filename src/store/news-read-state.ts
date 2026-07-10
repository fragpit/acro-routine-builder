import { STORAGE_KEYS } from './storage-keys';

export interface NewsReadState {
  latestSignature: string | null;
  hasUnread: boolean;
}

export function extractLatestNewsSection(source: string): string | null {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => /^##\s+\S/.test(line));
  if (start === -1) return null;

  const next = lines.findIndex(
    (line, index) => index > start && /^##\s+\S/.test(line),
  );
  const end = next === -1 ? lines.length : next;
  const section = lines.slice(start, end).join('\n').trim();

  return section.length > 0 ? section.replace(/\n{3,}/g, '\n\n') : null;
}

export function getLatestNewsSignature(source: string): string | null {
  const section = extractLatestNewsSection(source);
  if (!section) return null;

  let hash = 2166136261;
  for (let i = 0; i < section.length; i += 1) {
    hash ^= section.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return `${section.length}:${(hash >>> 0).toString(36)}`;
}

export function getNewsReadState(source: string): NewsReadState {
  const latestSignature = getLatestNewsSignature(source);
  if (!latestSignature) {
    return { latestSignature: null, hasUnread: false };
  }

  const stored = readStoredSignature();
  if (!stored) {
    writeStoredSignature(latestSignature);
    return { latestSignature, hasUnread: false };
  }

  return { latestSignature, hasUnread: stored !== latestSignature };
}

export function markNewsSeen(source: string): void {
  const latestSignature = getLatestNewsSignature(source);
  if (latestSignature) writeStoredSignature(latestSignature);
}

function readStoredSignature(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(STORAGE_KEYS.newsLastSeen);
  } catch {
    return null;
  }
}

function writeStoredSignature(signature: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEYS.newsLastSeen, signature);
  } catch {
    // Storage can be unavailable in private or locked-down contexts.
  }
}
