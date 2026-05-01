/**
 * Render the most recent change to the program total. Positive values are
 * green, negative values red. Renders nothing when delta is null (first
 * observation, unchanged value, or a bulk transition such as import / reset).
 */
export default function ScoreDelta({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const positive = delta > 0;
  const cls = positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';
  const sign = positive ? '+' : '-';
  return (
    <span
      className={`font-mono text-xs ${cls}`}
      title="Change since the previous total score"
    >
      ({sign}{Math.abs(delta).toFixed(3)})
    </span>
  );
}
