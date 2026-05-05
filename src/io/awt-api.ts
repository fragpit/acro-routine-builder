/**
 * AWT data access. Reads from a local snapshot bundled with the app
 * (`public/awt-snapshot/`) instead of hitting api.acroworldtour.com at
 * runtime. The snapshot is refreshed manually via `npm run snapshot:awt`.
 *
 * Function names are kept (`fetchCompetitions`, `fetchCompetition`) so the
 * UI and mapping layers don't need to change. Types still mirror the AWT
 * API response shape - the snapshot stores raw API JSON verbatim.
 */

const SNAPSHOT_BASE = `${import.meta.env.BASE_URL}awt-snapshot`;

export interface AwtCompetitionSummary {
  /**
   * MongoDB ObjectId as string. The AWT API exposes it verbatim as `_id`
   * (not `id`), and the snapshot preserves that - keep the underscore or
   * `fetchCompetition(comp._id)` will resolve to `.../undefined.json`.
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

export interface AwtSnapshotMeta {
  fetchedAt: string;
  count: number;
  source?: string;
}

async function getJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new Error(
      `Network error loading ${url}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `Snapshot file returned ${response.status} ${response.statusText} for ${url}`,
    );
  }
  return (await response.json()) as T;
}

/** List all snapshotted competitions (solo + published, all closed). */
export async function fetchCompetitions(): Promise<AwtCompetitionSummary[]> {
  return getJson<AwtCompetitionSummary[]>(`${SNAPSHOT_BASE}/index.json`);
}

/** Fetch a single competition with full results from the snapshot. */
export async function fetchCompetition(id: string): Promise<AwtCompetitionWithResults> {
  return getJson<AwtCompetitionWithResults>(
    `${SNAPSHOT_BASE}/competitions/${encodeURIComponent(id)}.json`,
  );
}

/** Read snapshot metadata. Returns null if the file is missing. */
export async function fetchSnapshotMeta(): Promise<AwtSnapshotMeta | null> {
  try {
    return await getJson<AwtSnapshotMeta>(`${SNAPSHOT_BASE}/meta.json`);
  } catch {
    return null;
  }
}
