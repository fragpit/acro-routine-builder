import type {
  Manoeuvre,
  Program,
  Run,
  TechnicalMarksByManoeuvreId,
} from '../rules/types';
import type { QualityCorrection } from './final-score';
import { excludedFromScoring } from './eligibility';

export const MIN_TECHNICAL_MARK = 0;
export const MAX_TECHNICAL_MARK = 10;
export const TECHNICAL_MARK_STEP = 0.5;
const TECHNICAL_QUALITY_PRECISION = 10;

export function clampTechnicalMark(mark: number): number {
  if (!Number.isFinite(mark)) return MAX_TECHNICAL_MARK;
  return Math.max(MIN_TECHNICAL_MARK, Math.min(MAX_TECHNICAL_MARK, mark));
}

export function normalizeTechnicalMark(mark: number): number {
  return Math.round(clampTechnicalMark(mark) / TECHNICAL_MARK_STEP) *
    TECHNICAL_MARK_STEP;
}

export function normalizeTechnicalQuality(quality: number): number {
  return Math.round(quality * TECHNICAL_QUALITY_PRECISION) /
    TECHNICAL_QUALITY_PRECISION;
}

export function defaultTechnicalMark(quality: QualityCorrection): number {
  return MAX_TECHNICAL_MARK * (quality.technical / 100);
}

export function technicalMarkForManoeuvre(
  manoeuvreId: string,
  marks: TechnicalMarksByManoeuvreId,
  quality: QualityCorrection,
): number {
  const mark = marks[manoeuvreId];
  return typeof mark === 'number'
    ? clampTechnicalMark(mark)
    : defaultTechnicalMark(quality);
}

export function runTechnicalMark(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
  marks: TechnicalMarksByManoeuvreId,
  quality: QualityCorrection,
): number {
  const excluded = excludedFromScoring(run, manoeuvres);
  const values = run.tricks
    .filter((t) => !excluded.has(t.id) && manoeuvres[t.manoeuvreId])
    .map((t) => technicalMarkForManoeuvre(t.manoeuvreId, marks, quality));
  if (values.length === 0) return 0;
  return values.reduce((sum, mark) => sum + mark, 0) / values.length;
}

export function programTechnicalQuality(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
  marks: TechnicalMarksByManoeuvreId,
  quality: QualityCorrection,
): number | null {
  const values = program.runs.flatMap((run) => {
    const excluded = excludedFromScoring(run, manoeuvres);
    return run.tricks
      .filter((t) => !excluded.has(t.id) && manoeuvres[t.manoeuvreId])
      .map((t) => technicalMarkForManoeuvre(t.manoeuvreId, marks, quality));
  });
  if (values.length === 0) return null;
  const average = values.reduce((sum, mark) => sum + mark, 0) / values.length;
  return normalizeTechnicalQuality(average * 10);
}
