import { useMemo, useState } from 'react';
import { MANOEUVRES } from '../../data/manoeuvres';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}

export default function TrickPicker({ open, onClose, onPick }: Props) {
  const [filter, setFilter] = useState('');
  const list = useMemo(
    () =>
      [...MANOEUVRES]
        .filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => a.coefficient - b.coefficient),
    [filter],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col animate-[slideUp_0.18s_ease-out] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="shrink-0 flex justify-center py-2">
          <span className="block w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="shrink-0 px-3 pb-2 flex items-center gap-2">
          <input
            type="search"
            autoFocus
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search tricks..."
            className="flex-1 px-3 py-2 text-sm rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
          >
            Cancel
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {list.length === 0 ? (
            <div className="text-sm text-slate-500 px-2 py-6 text-center">
              No tricks match &ldquo;{filter}&rdquo;
            </div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {list.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onPick(m.id)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 active:bg-sky-100 dark:active:bg-sky-950/40 hover:border-sky-500"
                  >
                    <span>{m.name}</span>
                    <span className="ml-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                      {m.coefficient.toFixed(2)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
