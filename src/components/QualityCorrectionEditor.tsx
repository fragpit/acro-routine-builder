import { useState } from 'react';
import type { QualityCorrection } from '../scoring/final-score';

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

function formatValue(value: number): string {
  return `${Math.round(value)}`;
}

function normalizeValue(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function stepValue(
  key: keyof QualityCorrection,
  value: number,
  direction: 1 | -1,
): number {
  if (key !== 'technical') {
    return normalizeValue(value + direction * CHOREO_STEP);
  }
  const next = direction > 0 ? Math.floor(value) + 1 : Math.ceil(value) - 1;
  return normalizeValue(next);
}

function QualityCorrectionControl({
  correctionKey,
  label,
  quality,
  onChange,
}: Props & {
  correctionKey: keyof QualityCorrection;
  label: string;
}) {
  const value = quality[correctionKey];
  const draftKey = `${correctionKey}:${value}`;
  const [draft, setDraft] = useState({
    key: draftKey,
    value: formatValue(value),
  });
  const inputValue = draft.key === draftKey
    ? draft.value
    : formatValue(value);

  function setValue(nextValue: number) {
    const normalized = normalizeValue(nextValue);
    onChange({ ...quality, [correctionKey]: normalized });
    setDraft({
      key: `${correctionKey}:${normalized}`,
      value: formatValue(normalized),
    });
  }

  function changeInput(nextValue: string) {
    if (!/^\d{0,3}$/.test(nextValue)) return;
    setDraft({ key: draftKey, value: nextValue });
  }

  function commitInput(nextValue: string) {
    if (!nextValue.trim()) {
      setDraft({
        key: draftKey,
        value: formatValue(value),
      });
      return;
    }
    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) {
      setDraft({
        key: draftKey,
        value: formatValue(value),
      });
      return;
    }
    setValue(parsed);
  }

  function step(direction: 1 | -1) {
    const parsed = Number(inputValue);
    const base = Number.isFinite(parsed) ? parsed : value;
    setValue(stepValue(correctionKey, base, direction));
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <label
        htmlFor={`quality-${correctionKey}`}
        className="text-slate-700 dark:text-slate-200 text-sm"
      >
        {label}
      </label>
      <div
        className="inline-flex items-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:border-sky-500"
        role="group"
        aria-label={label}
      >
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={value <= 0}
          aria-label={`Decrease ${label}`}
          className={btnCls}
        >
          -
        </button>
        <input
          id={`quality-${correctionKey}`}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(event) => changeInput(event.target.value)}
          onBlur={(event) => commitInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            } else if (
              event.key === 'ArrowUp' ||
              event.key === 'ArrowDown'
            ) {
              event.preventDefault();
              step(event.key === 'ArrowUp' ? 1 : -1);
            }
          }}
          className="w-10 bg-transparent px-0 text-right text-sm tabular-nums outline-none"
          aria-label={`${label} value`}
        />
        <span className="pr-1 text-sm select-none">%</span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={value >= 100}
          aria-label={`Increase ${label}`}
          className={btnCls}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function QualityCorrectionEditor({
  quality,
  onChange,
}: Props) {
  return (
    <div className="space-y-2">
      {KEYS.map(({ key, label }) => (
        <QualityCorrectionControl
          key={key}
          correctionKey={key}
          label={label}
          quality={quality}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
