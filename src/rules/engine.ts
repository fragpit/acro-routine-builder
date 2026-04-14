import type { Program, Violation, Manoeuvre } from './types';
import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import { validateHighCoeff } from './validators/high-coeff';
import { validateForbiddenConnections } from './validators/forbidden-connections';
import { validateLastTwo } from './validators/last-two';
import { validateMustBeFirst } from './validators/must-be-first';
import { validateOnePerRun } from './validators/one-per-run';
import { validateIncompatible } from './validators/incompatible';
import { validateTumblingInfRhythmic } from './validators/tumbling-inf-rhythmic';
import { validateAwtMistyToMisty } from './validators/awt-misty-to-misty';
import { validateBonusLimits } from './validators/bonus-limits';
import { validateRepetition } from './validators/repetition';
import { validateRepeatedBonus } from './validators/repeated-bonus';
import { validateSymmetry } from './validators/symmetry';

export type Validator = (program: Program, manoeuvres: Record<string, Manoeuvre>) => Violation[];

const validators: Validator[] = [
  validateHighCoeff,
  validateForbiddenConnections,
  validateLastTwo,
  validateMustBeFirst,
  validateOnePerRun,
  validateIncompatible,
  validateTumblingInfRhythmic,
  validateAwtMistyToMisty,
  validateBonusLimits,
  validateRepetition,
  validateRepeatedBonus,
  validateSymmetry,
];

/**
 * Runs all business rule validators against a program and returns a flat list
 * of violations. Pure function: safe to call on every state change.
 */
export function validateProgram(program: Program): Violation[] {
  return validators.flatMap((v) => v(program, MANOEUVRES_BY_ID));
}
