import LZString from 'lz-string';
import type { Program } from '../rules/types';
import {
  exportProgramJson,
  importProgramJson,
  type ImportResult,
} from './program-json';

const SHARE_VERSION = 'v1';
const ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

/**
 * Pure: compress a Program into a URL-safe `v1.<lz-string>` string. The
 * output is opaque to the worker; only the frontend understands it.
 */
export function compressProgram(program: Program, name: string | null): string {
  const json = exportProgramJson(program, name);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${SHARE_VERSION}.${compressed}`;
}

/**
 * Pure: inverse of compressProgram. Throws Error with a user-facing message
 * when the version tag is unknown, decompression fails, or the embedded JSON
 * is not a valid program. Validation is delegated to importProgramJson so the
 * wire format stays single-source.
 */
export function decompressProgram(payload: string): ImportResult {
  if (!payload) throw new Error('Empty share payload');
  const dot = payload.indexOf('.');
  if (dot < 0) throw new Error('Malformed share payload');
  const version = payload.slice(0, dot);
  const body = payload.slice(dot + 1);
  if (version !== SHARE_VERSION) {
    throw new Error(`Unsupported share link version: ${version}`);
  }
  const json = LZString.decompressFromEncodedURIComponent(body);
  if (!json) throw new Error('Could not decode share payload');
  return importProgramJson(json);
}

/**
 * True when the build was produced with a SHARE_SHORTENER_URL. Forks and
 * local builds without the env var get false, and the share button is
 * rendered disabled.
 */
export function isShortenerEnabled(): boolean {
  return typeof __SHARE_SHORTENER_URL__ === 'string' && __SHARE_SHORTENER_URL__.length > 0;
}

/**
 * Read a `?s=<id>` query parameter out of `location.search` (with or without
 * the leading `?`). Returns null when absent or when the id contains
 * characters outside the allowlist - guards against arbitrary user input
 * being sent to the worker.
 */
export function getShareId(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const id = params.get('s');
  if (!id) return null;
  if (!ID_PATTERN.test(id)) return null;
  return id;
}

/**
 * POST the compressed program to the worker, then return an absolute URL of
 * the form `${origin}${BASE_URL}/builder?s=${id}`. Throws Error with a
 * user-facing message on rate limit, payload-too-large, or transport error.
 */
export async function createShortLink(program: Program, name: string | null): Promise<string> {
  if (!isShortenerEnabled()) {
    throw new Error('Sharing is not available in this build');
  }
  const payload = compressProgram(program, name);
  const endpoint = `${trimSlash(__SHARE_SHORTENER_URL__!)}/r`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    });
  } catch {
    throw new Error('Could not reach the share service. Try again in a moment.');
  }
  if (res.status === 413) throw new Error('Program is too large to share.');
  if (res.status === 429) throw new Error('Too many share links - try again in a minute.');
  if (!res.ok) throw new Error(`Share service error (${res.status}).`);
  const data = (await res.json()) as { id?: unknown };
  if (typeof data.id !== 'string' || !ID_PATTERN.test(data.id)) {
    throw new Error('Share service returned an invalid response.');
  }
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${window.location.origin}${base}/builder?s=${data.id}`;
}

/**
 * GET the compressed payload for a short id and decompress it back into an
 * importable Program. 404 maps to "expired or not found"; other failures map
 * to user-facing messages.
 */
export async function fetchSharedProgram(id: string): Promise<ImportResult> {
  if (!isShortenerEnabled()) {
    throw new Error('Sharing is not available in this build');
  }
  if (!ID_PATTERN.test(id)) throw new Error('Invalid share id');
  const endpoint = `${trimSlash(__SHARE_SHORTENER_URL__!)}/r/${id}`;
  let res: Response;
  try {
    res = await fetch(endpoint);
  } catch {
    throw new Error('Could not reach the share service. Try again in a moment.');
  }
  if (res.status === 404) throw new Error('Share link expired or not found.');
  if (!res.ok) throw new Error(`Share service error (${res.status}).`);
  const payload = await res.text();
  return decompressProgram(payload);
}

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}
