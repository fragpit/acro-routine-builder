import { useState } from 'react';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import TrickPicker from './TrickPicker';

const RECENT_KEY = 'apc.recent-tricks';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === 'string' && !!MANOEUVRES_BY_ID[x]);
  } catch {
    return [];
  }
}

function saveRecent(ids: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

interface Props {
  armedManoeuvreId: string | null;
  onArm: (id: string | null) => void;
}

export default function PaletteStrip({ armedManoeuvreId, onArm }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());

  function pushRecent(id: string) {
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }

  function handlePick(id: string) {
    pushRecent(id);
    onArm(id);
    setPickerOpen(false);
  }

  function handleRecentTap(id: string) {
    if (armedManoeuvreId === id) {
      onArm(null);
      return;
    }
    pushRecent(id);
    onArm(id);
  }

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <div className="px-3 py-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="shrink-0 px-3 py-1.5 text-sm rounded-full border border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-medium active:bg-sky-500/20"
        >
          + Add trick
        </button>
        <div className="flex-1 min-w-0 overflow-x-auto">
          {recent.length > 0 ? (
            <ul className="flex gap-2 w-max">
              {recent.map((id) => {
                const m = MANOEUVRES_BY_ID[id];
                if (!m) return null;
                const armed = id === armedManoeuvreId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => handleRecentTap(id)}
                      className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        armed
                          ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{m.name}</span>
                      <span
                        className={`ml-1.5 text-[10px] ${
                          armed ? 'text-sky-200' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {m.coefficient.toFixed(2)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Recent tricks will appear here
            </span>
          )}
        </div>
        {armedManoeuvreId && (
          <button
            type="button"
            onClick={() => onArm(null)}
            className="shrink-0 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-red-500 hover:text-red-500"
            aria-label="Cancel selection"
          >
            Cancel
          </button>
        )}
      </div>
      {armedManoeuvreId && (
        <div className="px-3 pb-2 text-[11px] text-sky-700 dark:text-sky-300">
          Tap an empty slot below to insert, or tap the chip again to cancel.
        </div>
      )}
      <TrickPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handlePick} />
    </div>
  );
}
