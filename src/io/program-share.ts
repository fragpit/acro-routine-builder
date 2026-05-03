import LZString from 'lz-string';
import type { Program } from '../rules/types';
import { exportProgramJson, importProgramJson, type ImportResult } from './program-json';

const SHARE_VERSION = 'v1';
const HASH_PREFIX = '#p=';

/**
 * Encode a Program into a self-contained absolute share URL. The payload sits
 * in the URL hash so it never reaches the server, CDN access logs, or
 * Cloudflare Web Analytics. The recipient only needs the URL - no backend.
 */
export function encodeShareLink(program: Program, name: string | null): string {
  const json = exportProgramJson(program, name);
  const compressed = LZString.compressToEncodedURIComponent(json);
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${window.location.origin}${base}/builder${HASH_PREFIX}${SHARE_VERSION}.${compressed}`;
}

/**
 * Read a `#p=v1.<payload>` style hash and return the imported Program.
 *
 * Accepts the full hash (with leading `#`), the inner `p=...` form, or the
 * raw `v1.<payload>` body so callers do not have to strip prefixes
 * themselves. Throws Error with a user-facing message when the hash is
 * empty, the version tag is unknown, decompression fails, or the embedded
 * JSON is not a valid program.
 */
export function decodeShareLink(input: string): ImportResult {
  const payload = stripHashPrefix(input);
  if (!payload) throw new Error('Empty share link');
  const dot = payload.indexOf('.');
  if (dot < 0) throw new Error('Malformed share link');
  const version = payload.slice(0, dot);
  const body = payload.slice(dot + 1);
  if (version !== SHARE_VERSION) {
    throw new Error(`Unsupported share link version: ${version}`);
  }
  const json = LZString.decompressFromEncodedURIComponent(body);
  if (!json) throw new Error('Could not decode share link');
  return importProgramJson(json);
}

/**
 * True when the given location.hash carries a share payload. Cheap check used
 * by the on-mount hook before doing any decoding work.
 */
export function isShareHash(hash: string): boolean {
  return hash.startsWith(HASH_PREFIX);
}

function stripHashPrefix(input: string): string {
  let s = input;
  if (s.startsWith('#')) s = s.slice(1);
  if (s.startsWith('p=')) s = s.slice(2);
  return s;
}
