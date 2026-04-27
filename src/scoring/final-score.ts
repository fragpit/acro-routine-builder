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
  technical: 40,
  choreo: 40,
  landing: 20,
};

export interface QualityCorrection {
  technical: number;
  choreo: number;
}

export const DEFAULT_QUALITY: QualityCorrection = {
  technical: 60,
  choreo: 60,
};

export interface RunScoreBreakdown {
  tMark: number;
  cMark: number;
  lMark: number;
  tc: number;
  bonusPercent: number;
  symmetryBalanced: boolean;
  choreoPenalty: number;
  distribution: ScoreDistribution;
  quality: QualityCorrection;
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
 * minus unknowable diversity/chaining, plus 2/10 subjective. The Cq
 * quality correction applies only to the subjective base (9); the
 * symmetry bonus is a fixed +1 added after that correction.
 *
 * L (landing mark) defaults to 0 - landing is not predictable from
 * the routine structure.
 *
 * The repetition penalty (still carried as `choreoPenalty` for legacy
 * reasons) is applied as a malus to the bonus percentage, not to C.
 * When malus exceeds bonus, the bonus turns negative and reduces the
 * total.
 */
export function runScoreBreakdown(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
  symmetry: RunSymmetry,
  choreoPenalty: number,
  distribution: ScoreDistribution,
  quality: QualityCorrection,
): RunScoreBreakdown {
  const tc = runTechnicity(run, manoeuvres);
  const bonusPercent = runBonus(run, manoeuvres);

  const tMark = 10 * (quality.technical / 100);
  const cSubjective = 9;
  const symBonus = symmetry.balanced ? 1 : 0;
  const cMark = cSubjective * (quality.choreo / 100) + symBonus;
  const lMark = 0;

  const techFinal = tMark * tc * (distribution.technical / 100);
  const choreoFinal = cMark * (distribution.choreo / 100);
  const landingFinal = lMark * (distribution.landing / 100);
  const bonusFinal =
    (techFinal + choreoFinal) *
    ((bonusPercent - choreoPenalty) / 100) *
    (quality.technical / 100);
  const total = ceilTo3(
    techFinal + choreoFinal + landingFinal + bonusFinal,
  );

  return {
    tMark: ceilTo3(tMark),
    cMark: ceilTo3(cMark),
    lMark,
    tc,
    bonusPercent,
    symmetryBalanced: symmetry.balanced,
    choreoPenalty,
    distribution,
    quality,
    techFinal: ceilTo3(techFinal),
    choreoFinal: ceilTo3(choreoFinal),
    landingFinal: ceilTo3(landingFinal),
    bonusFinal: ceilTo3(bonusFinal),
    total,
  };
}
