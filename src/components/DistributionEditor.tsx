import type { ScoreDistribution } from '../scoring/final-score';

interface Props {
  distribution: ScoreDistribution;
  onChange: (d: ScoreDistribution) => void;
}

const STEP = 5;

const KEYS: { key: keyof ScoreDistribution; label: string }[] = [
  { key: 'technical', label: 'Technical' },
  { key: 'choreo', label: 'Choreo' },
  { key: 'landing', label: 'Landing' },
];

const btnCls =
  'w-7 h-7 inline-flex items-center justify-center ' +
  'text-slate-700 dark:text-slate-200 ' +
  'hover:bg-slate-100 dark:hover:bg-slate-700 ' +
  'disabled:opacity-30 disabled:hover:bg-transparent ' +
  'disabled:cursor-not-allowed select-none text-sm';

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

/**
 * Linked distribution controls that keep total = 100%:
 * - tech/choreo move together, landing compensates (±5 each → landing ∓10)
 * - landing moves by 10, split ±5 to tech and choreo
 */
function linkedStep(
  d: ScoreDistribution,
  key: keyof ScoreDistribution,
  delta: number,
): ScoreDistribution | null {
  let newT: number, newC: number, newL: number;
  if (key === 'landing') {
    const ld = delta * 2;
    newL = clamp(d.landing + ld);
    const half = (newL - d.landing) / 2;
    newT = clamp(d.technical - half);
    newC = clamp(d.choreo - half);
  } else {
    newT = clamp(d.technical + delta);
    newC = clamp(d.choreo + delta);
    newL = clamp(
      d.landing - (newT - d.technical) - (newC - d.choreo),
    );
  }
  if (newT + newC + newL > 100) return null;
  if (
    newT === d.technical &&
    newC === d.choreo &&
    newL === d.landing
  ) {
    return null;
  }
  return { technical: newT, choreo: newC, landing: newL };
}

export default function DistributionEditor({
  distribution,
  onChange,
}: Props) {
  function step(key: keyof ScoreDistribution, delta: number) {
    const next = linkedStep(distribution, key, delta);
    if (next) onChange(next);
  }

  function canStep(
    key: keyof ScoreDistribution,
    delta: number,
  ): boolean {
    return linkedStep(distribution, key, delta) !== null;
  }

  return (
    <div className="space-y-2">
      {KEYS.map(({ key, label }) => {
        const val = distribution[key];
        return (
          <div
            key={key}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-slate-700 dark:text-slate-200 text-sm">
              {label}
            </span>
            <div
              className="inline-flex items-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
              role="group"
              aria-label={`${label} distribution`}
            >
              <button
                type="button"
                onClick={() => step(key, -STEP)}
                disabled={!canStep(key, -STEP)}
                aria-label={`Decrease ${label}`}
                className={btnCls}
              >
                -
              </button>
              <span className="min-w-[2.5rem] px-1 text-center text-sm tabular-nums select-none">
                {val}%
              </span>
              <button
                type="button"
                onClick={() => step(key, STEP)}
                disabled={!canStep(key, STEP)}
                aria-label={`Increase ${label}`}
                className={btnCls}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
