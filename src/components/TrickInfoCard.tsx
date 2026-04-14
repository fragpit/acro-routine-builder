import type { Manoeuvre, PlacedTrick } from '../rules/types';
import { useProgramStore } from '../store/program-store';

interface Props {
  manoeuvre: Manoeuvre;
  placedTrick: PlacedTrick;
  onClose: () => void;
}

export default function TrickInfoCard({ manoeuvre, placedTrick, onClose }: Props) {
  const toggleBonus = useProgramStore((s) => s.toggleBonus);
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
