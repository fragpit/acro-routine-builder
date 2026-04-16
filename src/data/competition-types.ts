import type { BonusCategory } from '../rules/types';

/**
 * AWT/AWQ competition defaults.
 * FAI 2.9: runs are limited to 3 by default, 5 for superfinal.
 */
export const DEFAULT_RUNS = 3;
export const MAX_RUNS = 5;

/**
 * Per-run bonus category limits (FAI 3.5): max 5 twisted / 3 reversed / 2
 * flipped manoeuvres per run. Extras are unscored.
 */
export const BONUS_LIMITS: Readonly<Record<BonusCategory, number>> = Object.freeze({
  twisted: 5,
  reversed: 3,
  flipped: 2,
});

/**
 * High-coefficient manoeuvre cap (FAI 3.1): max 2 manoeuvres with coefficient
 * >= 1.95 per run. Extras are unscored.
 */
export const HIGH_COEFF_LIMIT = 2;
export const HIGH_COEFF_THRESHOLD = 1.95;
