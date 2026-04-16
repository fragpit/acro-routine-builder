import type { Manoeuvre, Run } from '../rules/types';
import type { RunSymmetry } from '../rules/validators/symmetry';
import { runTechnicity } from './technicity';
import { runBonus } from './bonus';

export interface ScoreDistribution {
  technical: number;
  choreo: number;
  landing: number;
}

export const DEFAULT_DISTRIBUTION: ScoreDistribution = {
  technical: 50,
  choreo: 50,
  landing: 0,
};

export interface RunScoreBreakdown {
  tMark: number;
  cMark: number;
  lMark: number;
  tc: number;
  bonusPercent: number;
  distribution: ScoreDistribution;
  techFinal: number;
  choreoFinal: number;
  landingFinal: number;
  bonusFinal: number;
  total: number;
}

/**
 * Ceil to 3 decimal places (FAI rounding convention).
 */
function ceilTo3(n: number): number {
  return Math.ceil(n * 1000) / 1000;
}

/**
 * Compute the full final score breakdown for a single run.
 *
 * T (technical mark) defaults to 10 - judges score execution quality
 * and we can't predict it, so we assume perfect.
 *
 * C (choreography mark) defaults to 9 + symmetry bonus (1 if balanced,
 * 0 otherwise). The 9 base accounts for the 8/10 objective criteria
 * minus unknowable diversity/chaining, plus 2/10 subjective.
 * Choreography penalty from repetitions reduces C proportionally.
 *
 * L (landing mark) defaults to 0 - landing is not predictable from
 * the routine structure.
 */
export function runScoreBreakdown(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
  symmetry: RunSymmetry,
  choreoPenalty: number,
  distribution: ScoreDistribution,
): RunScoreBreakdown {
  const tc = runTechnicity(run, manoeuvres);
  const bonusPercent = runBonus(run, manoeuvres);

  const tMark = 10;
  const cBase = 9 + (symmetry.balanced ? 1 : 0);
  const cMark = cBase * (1 - choreoPenalty / 100);
  const lMark = 0;

  const techFinal = tMark * tc * (distribution.technical / 100);
  const choreoFinal = cMark * (distribution.choreo / 100);
  const landingFinal = lMark * (distribution.landing / 100);
  const bonusFinal =
    (techFinal + choreoFinal) * (bonusPercent / 100);
  const total = ceilTo3(
    techFinal + choreoFinal + landingFinal + bonusFinal,
  );

  return {
    tMark,
    cMark: ceilTo3(cMark),
    lMark,
    tc,
    bonusPercent,
    distribution,
    techFinal: ceilTo3(techFinal),
    choreoFinal: ceilTo3(choreoFinal),
    landingFinal: ceilTo3(landingFinal),
    bonusFinal: ceilTo3(bonusFinal),
    total,
  };
}

/**
 * For AWT mode, compute the score with bonus scaled to a given
 * fraction (T/10 scaling per FAI 3.4.1).
 * fraction=1.0 means T=10 (upper bound), fraction=0.5 means T=5.
 */
export function runScoreBreakdownAwt(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
  symmetry: RunSymmetry,
  choreoPenalty: number,
  distribution: ScoreDistribution,
  bonusFraction: number,
): RunScoreBreakdown {
  const base = runScoreBreakdown(
    run,
    manoeuvres,
    symmetry,
    choreoPenalty,
    distribution,
  );
  const scaledBonusFinal = ceilTo3(
    (base.techFinal + base.choreoFinal) *
      ((base.bonusPercent * bonusFraction) / 100),
  );
  const total = ceilTo3(
    base.techFinal +
      base.choreoFinal +
      base.landingFinal +
      scaledBonusFinal,
  );
  return { ...base, bonusFinal: scaledBonusFinal, total };
}
