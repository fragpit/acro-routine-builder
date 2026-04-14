import type { Program, Manoeuvre, Violation } from '../types';

/**
 * Section 2 of trick_rules.md: each manoeuvre may have forbidden direct
 * connections - the next manoeuvre in the run cannot be in its forbidden list.
 */
export function validateForbiddenConnections(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    for (let i = 0; i < run.tricks.length - 1; i++) {
      const a = manoeuvres[run.tricks[i].manoeuvreId];
      const bTrick = run.tricks[i + 1];
      if (!a) continue;
      if (a.forbiddenConnectionTo.includes(bTrick.manoeuvreId)) {
        const b = manoeuvres[bTrick.manoeuvreId];
        violations.push({
          ruleId: 'forbidden-connections',
          severity: 'error',
          description: `Run ${runIndex + 1}: ${a.name} cannot be directly followed by ${b?.name ?? bTrick.manoeuvreId}`,
          affectedCells: [
            { runIndex, trickIndex: i },
            { runIndex, trickIndex: i + 1 },
          ],
        });
      }
    }
  });
  return violations;
}
