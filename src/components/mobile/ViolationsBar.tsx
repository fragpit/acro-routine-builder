import { useState } from 'react';
import { useProgramStore } from '../../store/program-store';

interface Props {
  onJumpTo: (runIndex: number) => void;
}

export default function ViolationsBar({ onJumpTo }: Props) {
  const violations = useProgramStore((s) => s.violations);
  const [open, setOpen] = useState(false);
  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');

  const summary =
    violations.length === 0
      ? 'No rule violations'
      : [
          errors.length > 0 ? `${errors.length} error${errors.length > 1 ? 's' : ''}` : null,
          warnings.length > 0 ? `${warnings.length} warning${warnings.length > 1 ? 's' : ''}` : null,
        ]
          .filter(Boolean)
          .join(' / ');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-4 py-2 text-sm flex items-center justify-between border-t ${
          violations.length === 0
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
            : errors.length > 0
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300'
        }`}
      >
        <span className="flex items-center gap-2">
          <span>{violations.length === 0 ? '✓' : errors.length > 0 ? '⛔' : '⚠'}</span>
          <span className="font-medium">{summary}</span>
        </span>
        <span className="text-xs">{open ? 'hide' : 'show'}</span>
      </button>

      {open && violations.length > 0 && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/60"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl max-h-[70vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Violations</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-lg leading-none"
                aria-label="close"
              >
                ✕
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {errors.map((v, i) => (
                <ViolationRow key={`e${i}`} severity="error" description={v.description} runIndexes={runIndexes(v)} onJumpTo={(ri) => { setOpen(false); onJumpTo(ri); }} />
              ))}
              {warnings.map((v, i) => (
                <ViolationRow key={`w${i}`} severity="warning" description={v.description} runIndexes={runIndexes(v)} onJumpTo={(ri) => { setOpen(false); onJumpTo(ri); }} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function runIndexes(v: { affectedCells: { runIndex: number }[] }): number[] {
  const set = new Set<number>();
  for (const c of v.affectedCells) set.add(c.runIndex);
  return [...set].sort((a, b) => a - b);
}

function ViolationRow({
  severity,
  description,
  runIndexes,
  onJumpTo,
}: {
  severity: 'error' | 'warning';
  description: string;
  runIndexes: number[];
  onJumpTo: (runIndex: number) => void;
}) {
  const icon = severity === 'error' ? '⛔' : '⚠';
  const toneText = severity === 'error' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300';
  return (
    <li className="px-4 py-3 text-sm flex items-start gap-2">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className={toneText}>{description}</div>
        {runIndexes.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {runIndexes.map((ri) => (
              <button
                key={ri}
                type="button"
                onClick={() => onJumpTo(ri)}
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
              >
                Run {ri + 1} →
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
