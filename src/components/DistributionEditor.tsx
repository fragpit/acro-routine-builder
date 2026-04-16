import type { ScoreDistribution } from '../scoring/final-score';
import { DEFAULT_DISTRIBUTION } from '../scoring/final-score';

interface Props {
  distribution: ScoreDistribution;
  onChange: (d: ScoreDistribution) => void;
}

const KEYS: { key: keyof ScoreDistribution; label: string }[] = [
  { key: 'technical', label: 'Technical' },
  { key: 'choreo', label: 'Choreo' },
  { key: 'landing', label: 'Landing' },
];

export default function DistributionEditor({
  distribution,
  onChange,
}: Props) {
  const total =
    distribution.technical +
    distribution.choreo +
    distribution.landing;
  const isDefault =
    distribution.technical === DEFAULT_DISTRIBUTION.technical &&
    distribution.choreo === DEFAULT_DISTRIBUTION.choreo &&
    distribution.landing === DEFAULT_DISTRIBUTION.landing;

  function update(
    key: keyof ScoreDistribution,
    raw: string,
  ) {
    const n = Math.max(0, Math.min(100, parseInt(raw) || 0));
    onChange({ ...distribution, [key]: n });
  }

  return (
    <div className="space-y-2">
      {KEYS.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center justify-between gap-3"
        >
          <span className="text-slate-700 dark:text-slate-200 text-sm">
            {label}
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={distribution[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-14 px-2 py-1 text-sm text-right rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-sky-500 outline-none"
            />
            <span className="text-xs text-slate-400">%</span>
          </div>
        </label>
      ))}
      <div className="flex items-center justify-between text-xs">
        <span
          className={
            total === 100
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }
        >
          Total: {total}%
          {total !== 100 && ' (must be 100%)'}
        </span>
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_DISTRIBUTION })}
            className="text-xs text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
          >
            reset
          </button>
        )}
      </div>
    </div>
  );
}
