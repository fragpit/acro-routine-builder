import { useProgramStore } from '../store/program-store';

function formatPenaltyByRun(map: Record<number, number>): string {
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([r, p]) => `Run ${Number(r) + 1}: -${p}%`)
    .join(', ');
}

export default function ViolationsPanel() {
  const violations = useProgramStore((s) => s.violations);
  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 max-h-48 overflow-y-auto">
      <div className="text-xs uppercase text-slate-500 mb-2">
        Violations{' '}
        {errors.length > 0 && (
          <span className="text-red-500 dark:text-red-400">{errors.length} error{errors.length > 1 ? 's' : ''}</span>
        )}
        {errors.length > 0 && warnings.length > 0 && <span className="text-slate-400"> / </span>}
        {warnings.length > 0 && (
          <span className="text-amber-600 dark:text-amber-400">{warnings.length} warning{warnings.length > 1 ? 's' : ''}</span>
        )}
      </div>
      {violations.length === 0 ? (
        <div className="text-sm text-emerald-600 dark:text-emerald-400">No rule violations.</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {errors.map((v, i) => (
            <li key={`e${i}`} className="text-red-700 dark:text-red-300">
              <span className="text-red-500 mr-1">⛔</span>
              {v.description}
            </li>
          ))}
          {warnings.map((v, i) => (
            <li key={`w${i}`} className="text-amber-700 dark:text-amber-300 flex items-start gap-1">
              <span className="text-amber-500">⚠</span>
              <span className="flex-1">{v.description}</span>
              {v.bonusMalusByRun && Object.keys(v.bonusMalusByRun).length > 0 && (
                <span className="font-mono text-xs text-amber-600 dark:text-amber-400 shrink-0">
                  {formatPenaltyByRun(v.bonusMalusByRun)} bonus
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
