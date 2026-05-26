import { useState } from 'react';
import type { Manoeuvre, PlacedTrick } from '../rules/types';
import {
  defaultTechnicalMark,
  normalizeTechnicalMark,
  technicalMarkForManoeuvre,
} from '../scoring/technical-marks';
import { useProgramStore } from '../store/program-store';
import { useScoreSettings } from '../store/score-settings';

interface Props {
  manoeuvre: Manoeuvre;
  placedTrick: PlacedTrick;
  onClose: () => void;
}

export default function TrickInfoCard({ manoeuvre, placedTrick, onClose }: Props) {
  const toggleBonus = useProgramStore((s) => s.toggleBonus);
  const technicalMarksByManoeuvreId = useProgramStore(
    (s) => s.program.technicalMarksByManoeuvreId ?? {},
  );
  const setTechnicalMark = useProgramStore((s) => s.setTechnicalMark);
  const quality = useScoreSettings((s) => s.quality);
  const hasCustomTechnicalMark =
    technicalMarksByManoeuvreId[manoeuvre.id] !== undefined;
  const defaultMark = defaultTechnicalMark(quality);
  const technicalMark = technicalMarkForManoeuvre(
    manoeuvre.id,
    technicalMarksByManoeuvreId,
    quality,
  );
  const technicalMarkDraftKey = `${manoeuvre.id}:${technicalMark}`;
  const [technicalMarkDraft, setTechnicalMarkDraft] = useState({
    key: technicalMarkDraftKey,
    value: technicalMark.toFixed(1),
  });
  const technicalMarkInput =
    technicalMarkDraft.key === technicalMarkDraftKey
      ? technicalMarkDraft.value
      : technicalMark.toFixed(1);

  function onTechnicalMarkChange(value: string) {
    const next = value.replace(',', '.');
    if (!/^\d{0,2}(\.\d?)?$/.test(next)) return;
    setTechnicalMarkDraft({ key: technicalMarkDraftKey, value: next });
  }

  function commitTechnicalMark(value: string) {
    if (!value.trim()) {
      setTechnicalMarkDraft({
        key: technicalMarkDraftKey,
        value: technicalMark.toFixed(1),
      });
      return;
    }
    const mark = Number(value);
    if (!Number.isFinite(mark)) {
      setTechnicalMarkDraft({
        key: technicalMarkDraftKey,
        value: technicalMark.toFixed(1),
      });
      return;
    }
    const normalized = normalizeTechnicalMark(mark);
    setTechnicalMark(manoeuvre.id, normalized);
    setTechnicalMarkDraft({
      key: `${manoeuvre.id}:${normalized}`,
      value: normalized.toFixed(1),
    });
  }

  function setTechnicalMarkValue(value: number) {
    const normalized = normalizeTechnicalMark(value);
    setTechnicalMark(manoeuvre.id, normalized);
    setTechnicalMarkDraft({
      key: `${manoeuvre.id}:${normalized}`,
      value: normalized.toFixed(1),
    });
  }

  function stepTechnicalMark(direction: 1 | -1) {
    const current = Number(technicalMarkInput);
    const base = Number.isFinite(current) ? current : technicalMark;
    setTechnicalMarkValue(base + direction * 0.5);
  }

  return (
    <div className="p-4 text-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-xs text-slate-500">{manoeuvre.sectionNumber}</div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{manoeuvre.name}</h2>
          <div className="text-xs text-slate-500 dark:text-slate-400">coeff: {manoeuvre.coefficient.toFixed(2)}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-lg leading-none"
          aria-label="close"
        >
          ✕
        </button>
      </div>

      <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300 mb-4">
        {manoeuvre.description.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      {manoeuvre.availableBonuses.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs uppercase text-slate-500 mb-2">Bonuses</h3>
          <div className="space-y-1">
            {manoeuvre.availableBonuses.map((b) => {
              const active = placedTrick.selectedBonuses.includes(b.id);
              const disabled = isBonusMutuallyExcluded(manoeuvre, placedTrick, b.id);
              return (
                <label
                  key={b.id}
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${active ? 'bg-sky-100 dark:bg-sky-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'} ${disabled ? 'opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    disabled={disabled}
                    onChange={() => toggleBonus(placedTrick.id, b.id)}
                  />
                  <span className="flex-1">{b.label}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">+{b.percent}%</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs uppercase text-slate-500 mb-2">Technical mark</h3>
        <div className="flex flex-wrap items-center gap-3 sm:hidden">
          <LargeStepButton
            label="Decrease technical mark"
            value="-"
            onClick={() => stepTechnicalMark(-1)}
          />
          <div className="flex min-w-20 items-baseline justify-center gap-1">
            <span className="font-mono text-2xl text-slate-900 dark:text-slate-100">
              {technicalMark.toFixed(1)}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">/ 10</span>
          </div>
          <LargeStepButton
            label="Increase technical mark"
            value="+"
            onClick={() => stepTechnicalMark(1)}
          />
          <button
            type="button"
            onClick={() => setTechnicalMark(manoeuvre.id, null)}
            disabled={!hasCustomTechnicalMark}
            className="ml-auto h-12 rounded border border-slate-300 px-3 text-sm text-slate-600 hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-sky-400 dark:disabled:hover:border-slate-700 dark:disabled:hover:text-slate-300"
          >
            Reset
          </button>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex w-24 overflow-hidden rounded border border-slate-300 bg-white focus-within:border-sky-500 dark:border-slate-700 dark:bg-slate-800">
            <input
              type="text"
              inputMode="decimal"
              value={technicalMarkInput}
              onChange={(e) => onTechnicalMarkChange(e.target.value)}
              onBlur={(e) => commitTechnicalMark(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  stepTechnicalMark(e.key === 'ArrowUp' ? 1 : -1);
                }
              }}
              className="min-w-0 flex-1 bg-transparent px-2 py-1 font-mono text-sm text-slate-900 outline-none dark:text-slate-100"
              aria-label="Technical mark"
            />
            <div className="flex w-5 shrink-0 flex-col border-l border-slate-300 dark:border-slate-700">
              <StepButton
                label="Increase technical mark"
                direction="up"
                onClick={() => stepTechnicalMark(1)}
              />
              <StepButton
                label="Decrease technical mark"
                direction="down"
                onClick={() => stepTechnicalMark(-1)}
              />
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">/ 10</span>
          <button
            type="button"
            onClick={() => setTechnicalMark(manoeuvre.id, null)}
            disabled={!hasCustomTechnicalMark}
            className="ml-auto rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-sky-400 dark:disabled:hover:border-slate-700 dark:disabled:hover:text-slate-300"
          >
            Reset
          </button>
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {hasCustomTechnicalMark
            ? 'Custom for this trick'
            : `Default ${defaultMark.toFixed(1)} from settings`}
        </div>
      </div>
    </div>
  );
}

function LargeStepButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: '+' | '-';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl font-semibold leading-none text-slate-600 hover:border-sky-500 hover:text-sky-600 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-sky-400 dark:active:bg-slate-700"
    >
      {value}
    </button>
  );
}

function isBonusMutuallyExcluded(m: Manoeuvre, t: PlacedTrick, bonusId: string): boolean {
  if (t.selectedBonuses.includes(bonusId)) return false;
  for (const group of m.mutualExclusions) {
    if (!group.includes(bonusId)) continue;
    if (group.some((g) => g !== bonusId && t.selectedBonuses.includes(g))) return true;
  }
  return false;
}

function StepButton({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: 'up' | 'down';
  onClick: () => void;
}) {
  const points = direction === 'up' ? '5 7 10 3 15 7' : '5 3 10 7 15 3';
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-sky-600 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-sky-400 dark:active:bg-slate-600 ${
        direction === 'up' ? 'border-b border-slate-300 dark:border-slate-700' : ''
      }`}
    >
      <svg
        viewBox="0 0 20 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-2.5 w-3"
        aria-hidden
      >
        <polyline points={points} />
      </svg>
    </button>
  );
}
