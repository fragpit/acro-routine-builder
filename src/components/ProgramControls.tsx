import { useEffect, useRef, useState } from 'react';
import { useProgramStore } from '../store/program-store';

export default function ProgramControls() {
  const currentName = useProgramStore((s) => s.currentName);
  const savedPrograms = useProgramStore((s) => s.savedPrograms);
  const saveProgramAs = useProgramStore((s) => s.saveProgramAs);
  const loadSavedProgram = useProgramStore((s) => s.loadSavedProgram);
  const deleteSavedProgram = useProgramStore((s) => s.deleteSavedProgram);
  const newProgram = useProgramStore((s) => s.newProgram);

  const [openMenu, setOpenMenu] = useState<'save' | 'load' | null>(null);
  const [saveName, setSaveName] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const savedNames = Object.keys(savedPrograms).sort((a, b) => a.localeCompare(b));

  function openSave() {
    setSaveName(currentName ?? '');
    setOpenMenu(openMenu === 'save' ? null : 'save');
  }

  function confirmSave() {
    const name = saveName.trim();
    if (!name) return;
    if (savedPrograms[name] && name !== currentName) {
      if (!confirm(`Overwrite existing program "${name}"?`)) return;
    }
    saveProgramAs(name);
    setOpenMenu(null);
  }

  return (
    <div ref={rootRef} className="flex items-center gap-2 relative">
      <span
        className="text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[14rem] truncate"
        title={currentName ?? 'Unsaved program'}
      >
        {currentName ?? <span className="italic font-normal text-slate-400">Untitled</span>}
      </span>

      <button
        type="button"
        onClick={openSave}
        className="px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
      >
        Save
      </button>

      <button
        type="button"
        onClick={() => setOpenMenu(openMenu === 'load' ? null : 'load')}
        className="px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-40"
        disabled={savedNames.length === 0}
      >
        Load ▾
      </button>

      <button
        type="button"
        onClick={() => {
          if (confirm('Start a new empty program? Current work will be replaced.')) newProgram();
        }}
        className="px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-500"
      >
        New
      </button>

      {openMenu === 'save' && (
        <div className="absolute top-full left-0 mt-1 w-72 z-20 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg p-2 space-y-2">
          <input
            type="text"
            autoFocus
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmSave();
              if (e.key === 'Escape') setOpenMenu(null);
            }}
            placeholder="Program name..."
            className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-sky-500 outline-none"
          />
          {savedNames.length > 0 && (
            <>
              <div className="text-[10px] uppercase text-slate-500">Overwrite existing</div>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {savedNames.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSaveName(n)}
                    className={`w-full text-left text-xs px-2 py-1 rounded truncate hover:bg-slate-100 dark:hover:bg-slate-700 ${n === saveName ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setOpenMenu(null)}
              className="px-2 py-0.5 text-xs rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSave}
              disabled={!saveName.trim()}
              className="px-2 py-0.5 text-xs rounded bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {openMenu === 'load' && savedNames.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-72 z-20 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg p-1 max-h-72 overflow-y-auto">
          {savedNames.map((n) => (
            <div
              key={n}
              className={`flex items-center gap-1 rounded ${n === currentName ? 'bg-sky-50 dark:bg-sky-900/30' : ''}`}
            >
              <button
                type="button"
                onClick={() => {
                  loadSavedProgram(n);
                  setOpenMenu(null);
                }}
                className="flex-1 text-left text-sm px-2 py-1 rounded truncate text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {n}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete saved program "${n}"?`)) deleteSavedProgram(n);
                }}
                className="px-1.5 py-1 text-xs text-slate-400 hover:text-red-500"
                aria-label={`Delete ${n}`}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
