import type { PlacedTrick, Program } from '../rules/types';
import { MANOEUVRES_BY_ID } from './manoeuvres';

/**
 * Drop bonus ids from `selectedBonuses` that are not listed in the
 * manoeuvre's `availableBonuses`. Orphan ids leak in from legacy imports,
 * older persisted state, or catalog changes that removed a bonus variant.
 * The scoring/validator layers look up bonuses through `availableBonuses`
 * and silently ignore orphans, so keeping them around only produces
 * misleading UI badges.
 */
export function sanitizePlacedTrick(trick: PlacedTrick): PlacedTrick {
  const m = MANOEUVRES_BY_ID[trick.manoeuvreId];
  if (!m) return trick;
  const valid = new Set(m.availableBonuses.map((b) => b.id));
  const filtered = trick.selectedBonuses.filter((id) => valid.has(id));
  if (filtered.length === trick.selectedBonuses.length) return trick;
  return { ...trick, selectedBonuses: filtered };
}

/** Apply {@link sanitizePlacedTrick} across every trick in every run. */
export function sanitizeProgram(program: Program): Program {
  let mutated = false;
  const runs = program.runs.map((run) => {
    let runMutated = false;
    const tricks = run.tricks.map((t) => {
      const next = sanitizePlacedTrick(t);
      if (next !== t) {
        runMutated = true;
        mutated = true;
      }
      return next;
    });
    return runMutated ? { ...run, tricks } : run;
  });
  return mutated ? { ...program, runs } : program;
}
