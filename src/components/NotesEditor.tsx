import { useEffect, useState } from 'react';
import { useProgramStore } from '../store/program-store';
import { MAX_NOTES_LENGTH } from '../rules/types';

interface Props {
  onDone: () => void;
}

/**
 * Inner content for the program-level notes editor. Reused inside both the
 * desktop right-side panel (Builder.tsx) and the mobile bottom-sheet
 * (NotesSheetMobile.tsx). Uses a local draft so keystrokes don't churn the
 * Zustand undo history - we commit once on Done.
 */
export default function NotesEditor({ onDone }: Props) {
  const notes = useProgramStore((s) => s.program.notes);
  const setNotes = useProgramStore((s) => s.setNotes);
  const [draft, setDraft] = useState(notes);

  useEffect(() => {
    setDraft(notes);
  }, [notes]);

  function commit() {
    if (draft !== notes) setNotes(draft);
    onDone();
  }

  return (
    <div className="flex flex-col h-full p-4 text-sm gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Free-form notes. Saved with the program.
          </div>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-lg leading-none"
          aria-label="close"
        >
          ✕
        </button>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, MAX_NOTES_LENGTH))}
        maxLength={MAX_NOTES_LENGTH}
        placeholder="Type notes here. Newlines are preserved."
        className="flex-1 min-h-[12rem] w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-sky-500 outline-none resize-none font-mono text-sm leading-snug"
      />
      <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right tabular-nums">
        {draft.length} / {MAX_NOTES_LENGTH}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={commit}
          className="px-4 py-2 text-sm rounded bg-sky-600 text-white hover:bg-sky-500"
        >
          Done
        </button>
      </div>
    </div>
  );
}
