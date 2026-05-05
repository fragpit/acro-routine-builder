import type { Program } from '../rules/types';
import { MAX_NOTES_LENGTH } from '../rules/types';
import { BONUS_CATALOG, MANOEUVRES_BY_ID } from '../data/manoeuvres';
import { MAX_RUNS } from '../data/competition-types';
import { sanitizeProgram } from '../data/sanitize';

const FORMAT = 'acro-routine-builder';
const LEGACY_FORMAT = 'acro-program-constructor';
const VERSION = 1;

/**
 * Defensive caps on import. Realistic programs fit well under all of these
 * (a typical file is ~5 KB, names are short, ids are `id_<timestamp>_<n>`
 * around 30 chars, runs have 6-8 tricks). Caps exist to keep a hostile or
 * runaway file from spiking memory during parse, exhausting localStorage
 * during persist, or producing a multi-MB share-link payload. Exported so
 * tests can pin the boundaries.
 */
export const MAX_IMPORT_BYTES = 1_000_000;
export const MAX_NAME_LENGTH = 200;
export const MAX_ID_LENGTH = 100;
export const MAX_TRICKS_PER_RUN = 50;
export const MAX_BONUSES_PER_TRICK = 20;
export const MAX_DEFAULT_BONUSES = 20;

/**
 * On-disk envelope for program export/import. Wraps a Program with a format
 * marker and version so future schema changes can be detected on import.
 */
export interface ProgramFile {
  format: typeof FORMAT | typeof LEGACY_FORMAT;
  version: number;
  name: string | null;
  exportedAt: string;
  program: Program;
}

/**
 * Serialise a program to a pretty-printed JSON string suitable for saving
 * to disk and re-importing later.
 */
export function exportProgramJson(program: Program, name: string | null): string {
  const file: ProgramFile = {
    format: FORMAT,
    version: VERSION,
    name,
    exportedAt: new Date().toISOString(),
    program,
  };
  return JSON.stringify(file, null, 2);
}

export interface ImportResult {
  program: Program;
  name: string | null;
}

/**
 * Parse and validate a JSON string produced by exportProgramJson. Throws
 * Error with a user-facing message when the payload is malformed, has the
 * wrong format marker, references unknown manoeuvres, or is otherwise not
 * safe to load.
 */
export function importProgramJson(text: string): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) {
    throw new Error(`File is too large to import (max ${MAX_IMPORT_BYTES} bytes)`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Not a valid JSON file');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Empty or invalid file');
  const file = parsed as Partial<ProgramFile>;
  if (file.format !== FORMAT && file.format !== LEGACY_FORMAT) {
    throw new Error(`Unknown format: expected "${FORMAT}"`);
  }
  if (typeof file.version !== 'number' || file.version > VERSION) {
    throw new Error(`Unsupported version: ${String(file.version)}`);
  }
  if (typeof file.name === 'string' && file.name.length > MAX_NAME_LENGTH) {
    throw new Error(`name must be at most ${MAX_NAME_LENGTH} characters`);
  }
  const program = sanitizeProgram(validateProgram(file.program));
  const name = typeof file.name === 'string' && file.name.trim() ? file.name.trim() : null;
  return { program, name };
}

function validateProgram(raw: unknown): Program {
  if (!raw || typeof raw !== 'object') throw new Error('Missing program');
  const p = raw as Record<string, unknown>;
  if (typeof p.awtMode !== 'boolean') throw new Error('program.awtMode must be boolean');
  if (typeof p.repeatAfterRuns !== 'number' || p.repeatAfterRuns < 1) {
    throw new Error('program.repeatAfterRuns must be >= 1');
  }
  if (p.repeatAfterRuns > MAX_RUNS) {
    throw new Error(`program.repeatAfterRuns must be <= ${MAX_RUNS}`);
  }
  if (!Array.isArray(p.runs)) throw new Error('program.runs must be an array');
  if (p.runs.length < 1) throw new Error('program.runs must have at least 1 run');
  if (p.runs.length > MAX_RUNS) {
    throw new Error(`program.runs must have at most ${MAX_RUNS} runs`);
  }
  const knownBonusIds = new Set(BONUS_CATALOG.map((b) => b.id));
  if (Array.isArray(p.defaultBonuses) && p.defaultBonuses.length > MAX_DEFAULT_BONUSES) {
    throw new Error(`program.defaultBonuses must have at most ${MAX_DEFAULT_BONUSES} entries`);
  }
  const defaultBonuses = Array.isArray(p.defaultBonuses)
    ? p.defaultBonuses.filter((x): x is string => typeof x === 'string' && knownBonusIds.has(x))
    : [];
  const seenRunIds = new Set<string>();
  const seenTrickIds = new Set<string>();
  const runs = p.runs.map((r, ri) => {
    if (!r || typeof r !== 'object') throw new Error(`Run ${ri} is not an object`);
    const run = r as Record<string, unknown>;
    if (typeof run.id !== 'string') throw new Error(`Run ${ri} missing id`);
    if (run.id.length > MAX_ID_LENGTH) {
      throw new Error(`Run ${ri} id must be at most ${MAX_ID_LENGTH} characters`);
    }
    if (seenRunIds.has(run.id)) throw new Error(`Duplicate run id "${run.id}"`);
    seenRunIds.add(run.id);
    if (!Array.isArray(run.tricks)) throw new Error(`Run ${ri} tricks must be an array`);
    if (run.tricks.length > MAX_TRICKS_PER_RUN) {
      throw new Error(`Run ${ri} must have at most ${MAX_TRICKS_PER_RUN} tricks`);
    }
    const tricks = run.tricks.map((t, ti) => {
      if (!t || typeof t !== 'object') throw new Error(`Trick ${ri}:${ti} is not an object`);
      const trick = t as Record<string, unknown>;
      if (typeof trick.id !== 'string') throw new Error(`Trick ${ri}:${ti} missing id`);
      if (trick.id.length > MAX_ID_LENGTH) {
        throw new Error(`Trick ${ri}:${ti} id must be at most ${MAX_ID_LENGTH} characters`);
      }
      if (seenTrickIds.has(trick.id)) {
        throw new Error(`Duplicate trick id "${trick.id}"`);
      }
      seenTrickIds.add(trick.id);
      if (typeof trick.manoeuvreId !== 'string') {
        throw new Error(`Trick ${ri}:${ti} missing manoeuvreId`);
      }
      if (!MANOEUVRES_BY_ID[trick.manoeuvreId]) {
        throw new Error(`Trick ${ri}:${ti} references unknown manoeuvre "${trick.manoeuvreId}"`);
      }
      const rawSide = trick.side;
      if (rawSide !== 'L' && rawSide !== 'R' && rawSide !== null) {
        throw new Error(`Trick ${ri}:${ti} has invalid side`);
      }
      const side: 'L' | 'R' | null = rawSide;
      if (Array.isArray(trick.selectedBonuses) && trick.selectedBonuses.length > MAX_BONUSES_PER_TRICK) {
        throw new Error(
          `Trick ${ri}:${ti} must have at most ${MAX_BONUSES_PER_TRICK} selectedBonuses`,
        );
      }
      const selectedBonuses = Array.isArray(trick.selectedBonuses)
        ? trick.selectedBonuses.filter((x): x is string => typeof x === 'string')
        : [];
      return { id: trick.id, manoeuvreId: trick.manoeuvreId, side, selectedBonuses };
    });
    return { id: run.id, tricks };
  });
  const notes = typeof p.notes === 'string' ? p.notes : '';
  if (notes.length > MAX_NOTES_LENGTH) {
    throw new Error(`program.notes must be at most ${MAX_NOTES_LENGTH} characters`);
  }
  return {
    awtMode: p.awtMode,
    runs,
    repeatAfterRuns: p.repeatAfterRuns,
    defaultBonuses,
    notes,
  };
}
