import type {
  Manoeuvre,
  Run,
  TechnicalMarksByManoeuvreId,
} from '../rules/types';
import type { RunSymmetry } from '../rules/validators/symmetry';
import { runTechnicity } from './technicity';
import { runBonus, runScaledBonus } from './bonus';
import { runTechnicalMark } from './technical-marks';

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
  technical: 50,
  choreo: 50,
};

export interface RunScoreBreakdown {
  tMark: number;
  cMark: number;
  lMark: number;
  tc: number;
  bonusPercent: number;
  scaledBonusPercent: number;
  symmetryBalanced: boolean;
  bonusMalus: number;
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
 * T (technical mark) is the average technical mark across every
 * scoring-eligible trick in the run. Tricks without a custom mark use
 * the global Tq default.
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
 * The bonus formula is asymmetric: each positive bonus contribution is
 * weighted by that trick's technical mark, but the malus is not. This
 * mirrors AWT's per-trick technical scaling (api/models/competitions.py:
 * 1409-1428 in acroworldtour.com), while the repetition malus applies
 * as a flat percent.
 *   bonus = (techFinal + choreoFinal) * (scaledBonus% - malus%) / 100
 * When malus exceeds the scaled bonus, `bonusFinal` turns negative
 * and reduces the total.
 */
export function runScoreBreakdown(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
  symmetry: RunSymmetry,
  bonusMalus: number,
  distribution: ScoreDistribution,
  quality: QualityCorrection,
  technicalMarksByManoeuvreId: TechnicalMarksByManoeuvreId = {},
): RunScoreBreakdown {
  const tc = runTechnicity(run, manoeuvres);
  const bonusPercent = runBonus(run, manoeuvres);
  const scaledBonusPercent = runScaledBonus(
    run,
    manoeuvres,
    technicalMarksByManoeuvreId,
    quality,
  );

  const tMark = runTechnicalMark(
    run,
    manoeuvres,
    technicalMarksByManoeuvreId,
    quality,
  );
  const cSubjective = 9;
  const symBonus = symmetry.balanced ? 1 : 0;
  const cMark = cSubjective * (quality.choreo / 100) + symBonus;
  const lMark = 0;

  const techFinal = tMark * tc * (distribution.technical / 100);
  const choreoFinal = cMark * (distribution.choreo / 100);
  const landingFinal = lMark * (distribution.landing / 100);
  const bonusFinal =
    (techFinal + choreoFinal) *
    ((scaledBonusPercent - bonusMalus) / 100);
  const total = ceilTo3(
    techFinal + choreoFinal + landingFinal + bonusFinal,
  );

  return {
    tMark: ceilTo3(tMark),
    cMark: ceilTo3(cMark),
    lMark,
    tc,
    bonusPercent,
    scaledBonusPercent,
    symmetryBalanced: symmetry.balanced,
    bonusMalus,
    distribution,
    quality,
    techFinal: ceilTo3(techFinal),
    choreoFinal: ceilTo3(choreoFinal),
    landingFinal: ceilTo3(landingFinal),
    bonusFinal: ceilTo3(bonusFinal),
    total,
  };
}
