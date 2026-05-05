#!/usr/bin/env node
/**
 * Refresh public/awt-snapshot/ from api.acroworldtour.com.
 *
 * Run with `npm run snapshot:awt`. Writes:
 *   public/awt-snapshot/index.json                — solo+published list
 *   public/awt-snapshot/competitions/{id}.json    — full per-competition
 *   public/awt-snapshot/meta.json                 — { fetchedAt, count }
 *
 * The runtime client at src/io/awt-api.ts reads these files instead of
 * hitting the AWT API directly. We only commit `closed` competitions:
 * if the API ever returns a non-closed solo+published competition, the
 * script aborts with exit 1 — freezing live results in git would let
 * them drift from the real source.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const SNAPSHOT_DIR = join(REPO_ROOT, 'public', 'awt-snapshot');
const COMPETITIONS_DIR = join(SNAPSHOT_DIR, 'competitions');

const API_BASE = 'https://api.acroworldtour.com/public';
const REQUEST_DELAY_MS = 200;
const MAX_RETRIES = 3;

async function main() {
  console.log(`Fetching competition list from ${API_BASE}/competitions/`);
  const allCompetitions = await fetchJson(`${API_BASE}/competitions/`);
  if (!Array.isArray(allCompetitions)) {
    throw new Error('Expected an array from /competitions/');
  }

  const eligible = allCompetitions.filter(
    (c) => c.type === 'solo' && c.published !== false,
  );
  console.log(
    `${allCompetitions.length} total / ${eligible.length} solo+published`,
  );

  const nonClosed = eligible.filter((c) => c.state !== 'closed');
  if (nonClosed.length > 0) {
    console.error(
      'Refusing to snapshot live competitions. The following are not closed:',
    );
    for (const c of nonClosed) {
      console.error(`  ${c._id}  state=${c.state}  ${c.name}`);
    }
    console.error(
      'Either wait until they close, or update the script to allow non-closed states.',
    );
    process.exit(1);
  }

  await mkdir(COMPETITIONS_DIR, { recursive: true });

  const stats = { added: 0, updated: 0, unchanged: 0, removed: 0 };

  for (const summary of eligible) {
    const id = summary._id;
    const url = `${API_BASE}/competitions/${encodeURIComponent(id)}`;
    process.stdout.write(`  ${id}  ${summary.name}... `);
    const detail = await fetchJson(url);
    const path = join(COMPETITIONS_DIR, `${id}.json`);
    const change = await writeIfChanged(path, detail, { pretty: false });
    stats[change] += 1;
    console.log(change);
    await sleep(REQUEST_DELAY_MS);
  }

  await writeIfChanged(join(SNAPSHOT_DIR, 'index.json'), eligible, {
    pretty: true,
  });

  const meta = {
    fetchedAt: new Date().toISOString(),
    count: eligible.length,
    source: 'api.acroworldtour.com',
  };
  await writeFile(
    join(SNAPSHOT_DIR, 'meta.json'),
    JSON.stringify(meta, null, 2) + '\n',
    'utf8',
  );

  stats.removed = await pruneStale(
    COMPETITIONS_DIR,
    new Set(eligible.map((c) => `${c._id}.json`)),
  );

  console.log('');
  console.log(
    `Done. added=${stats.added} updated=${stats.updated} unchanged=${stats.unchanged} removed=${stats.removed}`,
  );
  console.log(`Snapshot at ${SNAPSHOT_DIR}`);
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
          await sleep(500 * 2 ** (attempt - 1));
          continue;
        }
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
      }
      return await response.json();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(500 * 2 ** (attempt - 1));
        continue;
      }
      throw new Error(
        `Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
  throw lastError ?? new Error(`Unknown fetch failure for ${url}`);
}

async function writeIfChanged(path, payload, { pretty }) {
  const next = (pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload)) + '\n';
  let prev = null;
  try {
    prev = await readFile(path, 'utf8');
  } catch {
    // missing file -> treat as added
  }
  if (prev === null) {
    await writeFile(path, next, 'utf8');
    return 'added';
  }
  if (hash(prev) === hash(next)) {
    return 'unchanged';
  }
  await writeFile(path, next, 'utf8');
  return 'updated';
}

async function pruneStale(dir, keep) {
  let removed = 0;
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return 0;
  }
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    if (keep.has(entry)) continue;
    await rm(join(dir, entry));
    removed += 1;
    console.log(`  removed stale ${entry}`);
  }
  return removed;
}

function hash(s) {
  return createHash('sha1').update(s).digest('hex');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
