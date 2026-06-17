import type { QualityCorrection } from '../scoring/final-score';
import { normalizeTechnicalQuality } from '../scoring/technical-marks';

interface Props {
  quality: QualityCorrection;
  onChange: (q: QualityCorrection) => void;
}

const CHOREO_STEP = 5;

const KEYS: { key: keyof QualityCorrection; label: string }[] = [
  { key: 'technical', label: 'Tq default' },
  { key: 'choreo', label: 'Cq correction' },
];

const btnCls =
  'w-7 h-7 inline-flex items-center justify-center ' +
  'text-slate-700 dark:text-slate-200 ' +
  'hover:bg-slate-100 dark:hover:bg-slate-700 ' +
  'disabled:opacity-30 disabled:hover:bg-transparent ' +
  'disabled:cursor-not-allowed select-none text-sm';

function formatValue(key: keyof QualityCorrection, value: number): string {
  return key === 'technical' ? value.toFixed(1) : `${value}`;
}

function stepValue(
  key: keyof QualityCorrection,
  value: number,
  direction: 1 | -1,
): number {
  if (key !== 'technical') {
    return Math.max(0, Math.min(100, value + direction * CHOREO_STEP));
  }
  const next = direction > 0 ? Math.floor(value) + 1 : Math.ceil(value) - 1;
  return normalizeTechnicalQuality(Math.max(0, Math.min(100, next)));
}

export default function QualityCorrectionEditor({
  quality,
  onChange,
}: Props) {
  function step(
    key: keyof QualityCorrection,
    direction: 1 | -1,
  ) {
    const cur = quality[key];
    const next = stepValue(key, cur, direction);
    if (next !== cur) onChange({ ...quality, [key]: next });
  }

  return (
    <div className="space-y-2">
      {KEYS.map(({ key, label }) => {
        const val = quality[key];
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
              aria-label={label}
            >
              <button
                type="button"
                onClick={() => step(key, -1)}
                disabled={val <= 0}
                aria-label={`Decrease ${label}`}
                className={btnCls}
              >
                -
              </button>
              <span className="min-w-[2.5rem] px-1 text-center text-sm tabular-nums select-none">
                {formatValue(key, val)}%
              </span>
              <button
                type="button"
                onClick={() => step(key, 1)}
                disabled={val >= 100}
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
