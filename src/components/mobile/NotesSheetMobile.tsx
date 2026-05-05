import { useEffect } from 'react';
import NotesEditor from '../NotesEditor';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Bottom-sheet wrapper for the program-level notes editor on mobile. Mirrors
 * the layout of TrickSheet (backdrop + slide-up dialog + drag handle) so the
 * notes editor feels consistent with the trick-info sheet that already opens
 * from the run.
 */
export default function NotesSheetMobile({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
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
        <div className="flex-1 overflow-y-auto">
          <NotesEditor onDone={onClose} />
        </div>
      </div>
    </div>
  );
}
