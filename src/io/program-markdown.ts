import type { Program, Violation } from '../rules/types';
import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import { runTechnicity } from '../scoring/technicity';
import { runBonus } from '../scoring/bonus';
import { exclusionsByTrick } from '../scoring/eligibility';

/**
 * Render a program as a human-readable markdown report with settings, a
 * per-run numbered trick list, scoring summary, and any rule violations.
 * Markdown is one-way: it cannot be re-imported (use exportProgramJson for
 * that).
 */
export function exportProgramMarkdown(
  program: Program,
  name: string | null,
  violations: Violation[],
): string {
  const lines: string[] = [];
  lines.push(`# ${name ?? 'Untitled program'}`);
  lines.push('');
  lines.push(`- Mode: ${program.awtMode ? 'AWT' : 'AWQ'}`);
  lines.push(`- Runs: ${program.runs.length}`);
  lines.push(`- Reset gap: ${program.repeatAfterRuns}`);
  const defaults = program.defaultBonuses
    .map((id) => labelForBonus(program, id))
    .filter(Boolean);
  lines.push(`- Default bonuses: ${defaults.length > 0 ? defaults.join(', ') : 'none'}`);
  lines.push(`- Exported: ${new Date().toISOString()}`);
  lines.push('');

  const choreoByRun = collectChoreoPenalty(violations);

  for (let i = 0; i < program.runs.length; i++) {
    const run = program.runs[i];
    const ignored = exclusionsByTrick(run, MANOEUVRES_BY_ID);
    lines.push(`## Run ${i + 1}`);
    lines.push('');
    if (run.tricks.length === 0) {
      lines.push('_empty_');
      lines.push('');
      continue;
    }
    run.tricks.forEach((t, ti) => {
      const m = MANOEUVRES_BY_ID[t.manoeuvreId];
      if (!m) return;
      const bonuses = t.selectedBonuses
        .map((b) => m.availableBonuses.find((ab) => ab.id === b)?.label ?? b)
        .join(', ');
      const reasons = ignored.get(t.id);
      const head = t.side
        ? `${m.name} (${m.coefficient.toFixed(2)}, ${t.side})`
        : `${m.name} (${m.coefficient.toFixed(2)})`;
      const parts = [`${ti + 1}. ${head}`];
      if (bonuses) parts.push(bonuses);
      if (reasons) parts.push(`ignored: ${reasons.join('; ')}`);
      lines.push(parts.join(' - '));
    });
    lines.push('');
    const tc = runTechnicity(run, MANOEUVRES_BY_ID);
    const bonus = runBonus(run, MANOEUVRES_BY_ID);
    lines.push(`- Technicity: ${tc.toFixed(3)}`);
    lines.push(`- Bonus: +${bonus.toFixed(1)}%`);
    const choreo = choreoByRun[i] ?? 0;
    if (choreo > 0) lines.push(`- Choreo penalty: -${choreo}%`);
    lines.push('');
  }

  if (violations.length > 0) {
    lines.push('## Violations');
    lines.push('');
    for (const v of violations) {
      const cells = v.affectedCells
        .map((c) => `R${c.runIndex + 1}:${c.trickIndex + 1}`)
        .join(', ');
      lines.push(`- [${v.severity}] ${v.description}${cells ? ` (${cells})` : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function labelForBonus(program: Program, bonusId: string): string | null {
  for (const run of program.runs) {
    for (const t of run.tricks) {
      const m = MANOEUVRES_BY_ID[t.manoeuvreId];
      const def = m?.availableBonuses.find((b) => b.id === bonusId);
      if (def) return def.label;
    }
  }
  for (const m of Object.values(MANOEUVRES_BY_ID)) {
    const def = m.availableBonuses.find((b) => b.id === bonusId);
    if (def) return def.label;
  }
  return bonusId;
}

function collectChoreoPenalty(violations: Violation[]): Record<number, number> {
  const totals: Record<number, number> = {};
  for (const v of violations) {
    if (!v.choreoPenaltyByRun) continue;
    for (const [runIndex, pct] of Object.entries(v.choreoPenaltyByRun)) {
      const i = Number(runIndex);
      totals[i] = (totals[i] ?? 0) + pct;
    }
  }
  return totals;
}
