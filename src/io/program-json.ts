import type { Program } from '../rules/types';
import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import { sanitizeProgram } from '../data/sanitize';

const FORMAT = 'acro-routine-builder';
const LEGACY_FORMAT = 'acro-program-constructor';
const VERSION = 1;

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
  if (!Array.isArray(p.runs)) throw new Error('program.runs must be an array');
  const defaultBonuses = Array.isArray(p.defaultBonuses)
    ? p.defaultBonuses.filter((x): x is string => typeof x === 'string')
    : [];
  const runs = p.runs.map((r, ri) => {
    if (!r || typeof r !== 'object') throw new Error(`Run ${ri} is not an object`);
    const run = r as Record<string, unknown>;
    if (typeof run.id !== 'string') throw new Error(`Run ${ri} missing id`);
    if (!Array.isArray(run.tricks)) throw new Error(`Run ${ri} tricks must be an array`);
    const tricks = run.tricks.map((t, ti) => {
      if (!t || typeof t !== 'object') throw new Error(`Trick ${ri}:${ti} is not an object`);
      const trick = t as Record<string, unknown>;
      if (typeof trick.id !== 'string') throw new Error(`Trick ${ri}:${ti} missing id`);
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
      const selectedBonuses = Array.isArray(trick.selectedBonuses)
        ? trick.selectedBonuses.filter((x): x is string => typeof x === 'string')
        : [];
      return { id: trick.id, manoeuvreId: trick.manoeuvreId, side, selectedBonuses };
    });
    return { id: run.id, tricks };
  });
  return {
    awtMode: p.awtMode,
    runs,
    repeatAfterRuns: p.repeatAfterRuns,
    defaultBonuses,
  };
}
