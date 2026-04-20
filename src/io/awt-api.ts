/**
 * Thin HTTP client for the public acroworldtour.com API.
 *
 * All endpoints are CORS-enabled for any origin, so a static build on
 * GitHub Pages can call them directly. No authentication is required.
 */

import { cachedJson } from './api-cache';

const AWT_API_BASE = 'https://api.acroworldtour.com/public';

// Competitions list changes infrequently (new events added once or twice
// a month); 30 minutes balances freshness against request volume.
const COMPETITIONS_LIST_TTL_MS = 30 * 60 * 1000;
// Once a competition is `closed`, its results are frozen. Cache for a
// week. Open / init competitions (live events) skip the cache entirely.
const COMPETITION_DETAIL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AwtCompetitionSummary {
  /**
   * MongoDB ObjectId as string. The API exposes it verbatim as `_id`
   * (not `id`), which is unusual for public JSON APIs - keep the
   * underscore or `fetchCompetition(comp._id)` will call
   * `/competitions/undefined`.
   */
  _id: string;
  name: string;
  code: string;
  type: 'solo' | 'synchro';
  state: string;
  start_date: string;
  end_date: string;
  location?: string;
  seasons: string[];
  published?: boolean;
  number_of_runs?: number;
  number_of_pilots?: number;
}

export interface AwtPilot {
  civlid: number;
  name: string;
  country?: string;
}

export interface AwtBonus {
  name: string;
  bonus: number;
}

export interface AwtUniqueTrick {
  name: string;
  acronym?: string;
  base_trick: string;
  uniqueness: string[];
  bonus_types: string[];
  bonuses: AwtBonus[];
  technical_coefficient?: number;
  bonus?: number;
}

export interface AwtJudgesMark {
  technical?: number;
  choreography?: number;
  landing?: number;
}

export interface AwtFinalMarks {
  score?: number;
  technical?: number;
  choreography?: number;
  landing?: number;
  bonus?: number;
  judges_mark?: AwtJudgesMark | null;
  notes?: string[];
}

export interface AwtFlight {
  pilot?: AwtPilot | null;
  tricks: AwtUniqueTrick[];
  did_not_start?: boolean;
  final_marks?: AwtFinalMarks | null;
}

export interface AwtRunResults {
  results: Record<string, AwtFlight[] | undefined>;
}

export interface AwtOverallEntry {
  pilot?: AwtPilot | null;
  score?: number;
}

export interface AwtCompetitionResultsContainer {
  runs_results?: AwtRunResults[];
  results?: Record<string, AwtOverallEntry[] | undefined>;
}

export interface AwtCompetitionWithResults extends AwtCompetitionSummary {
  results: AwtCompetitionResultsContainer;
}

async function getJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new Error(
      `Network error calling ${url}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!response.ok) {
    throw new Error(`AWT API returned ${response.status} ${response.statusText} for ${url}`);
  }
  return (await response.json()) as T;
}

/** List all competitions (both solo and synchro, all states). */
export async function fetchCompetitions(): Promise<AwtCompetitionSummary[]> {
  return cachedJson<AwtCompetitionSummary[]>(
    `${AWT_API_BASE}/competitions/`,
    getJson,
    { ttlMs: COMPETITIONS_LIST_TTL_MS },
  );
}

/** Fetch a single competition including per-run flight results. */
export async function fetchCompetition(id: string): Promise<AwtCompetitionWithResults> {
  return cachedJson<AwtCompetitionWithResults>(
    `${AWT_API_BASE}/competitions/${encodeURIComponent(id)}`,
    getJson,
    {
      ttlMs: COMPETITION_DETAIL_TTL_MS,
      shouldCache: (comp) => comp.state === 'closed',
    },
  );
}

export { clearApiCache } from './api-cache';
