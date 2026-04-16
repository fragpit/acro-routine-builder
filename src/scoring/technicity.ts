import type { Manoeuvre, Run } from '../rules/types';
import { excludedFromScoring } from './eligibility';

/**
 * Technicity per FAI 3.2: average of the 3 highest coefficient manoeuvres in
 * the run, taken from scoring-eligible tricks (see excludedFromScoring).
 * When fewer than 3 eligible tricks exist, averages whatever is available.
 */
export function runTechnicity(run: Run, manoeuvres: Record<string, Manoeuvre>): number {
  const excluded = excludedFromScoring(run, manoeuvres);
  const coeffs = run.tricks
    .filter((t) => !excluded.has(t.id))
    .map((t) => manoeuvres[t.manoeuvreId]?.coefficient)
    .filter((c): c is number => typeof c === 'number')
    .sort((a, b) => b - a)
    .slice(0, 3);
  if (coeffs.length === 0) return 0;
  return coeffs.reduce((s, c) => s + c, 0) / coeffs.length;
}
