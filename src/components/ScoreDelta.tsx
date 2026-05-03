/**
 * Render the change in the program total against its baseline. Positive
 * values are green, negative red, zero neutral (used by the pinned-baseline
 * mode where the indicator is shown immediately after pinning, before any
 * edits). Renders nothing when delta is `null`.
 */
export default function ScoreDelta({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  let cls: string;
  let sign: string;
  if (delta > 0) {
    cls = 'text-emerald-600 dark:text-emerald-400';
    sign = '+';
  } else if (delta < 0) {
    cls = 'text-red-600 dark:text-red-400';
    sign = '-';
  } else {
    cls = 'text-slate-500 dark:text-slate-400';
    sign = '+';
  }
  return (
    <span
      className={`font-mono text-xs ${cls}`}
      title="Change since the baseline total score"
    >
      ({sign}{Math.abs(delta).toFixed(3)})
    </span>
  );
}
