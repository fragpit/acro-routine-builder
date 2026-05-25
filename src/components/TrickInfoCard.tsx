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

      <div className="mb-4">
        <h3 className="text-xs uppercase text-slate-500 mb-2">Technical mark</h3>
        <div className="flex items-center gap-2">
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
                const direction = e.key === 'ArrowUp' ? 1 : -1;
                const current = Number(technicalMarkInput);
                const base = Number.isFinite(current) ? current : technicalMark;
                const next = normalizeTechnicalMark(base + direction * 0.5);
                setTechnicalMark(manoeuvre.id, next);
                setTechnicalMarkDraft({
                  key: `${manoeuvre.id}:${next}`,
                  value: next.toFixed(1),
                });
              }
            }}
            className="w-24 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            aria-label="Technical mark"
          />
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

      {manoeuvre.availableBonuses.length > 0 && (
        <div>
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
    </div>
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
