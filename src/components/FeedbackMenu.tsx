import { useEffect, useRef, useState } from 'react';
import { IconFeedback, IconGithub, IconMail } from './icons';

const FEEDBACK_EMAIL = 'fragpit@gmail.com';
const GITHUB_ISSUES_URL = 'https://github.com/fragpit/acro-routine-builder/issues';

function buildMailto(): string {
  const subject = encodeURIComponent('Acro Routine Builder feedback');
  const body = encodeURIComponent(`\n\n---\nVersion: ${__APP_VERSION__}`);
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}

interface Props {
  triggerClassName?: string;
  iconSize?: 'sm' | 'md';
  align?: 'right' | 'left';
  direction?: 'down' | 'up';
}

/**
 * Feedback button with a popover listing the available channels
 * (GitHub Issues, email). Used both in the desktop header and in
 * the mobile drawer footer.
 */
export default function FeedbackMenu({
  triggerClassName = '',
  iconSize = 'md',
  align = 'right',
  direction = 'down',
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const iconClass = iconSize === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  const alignClass = align === 'right' ? 'right-0' : 'left-0';
  const directionClass = direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1';

  // Defer closing so the browser processes the link's default action
  // (follow href / open mail app) before the <a> is unmounted. Without
  // this, iOS Safari cancels the navigation and click-emulation in
  // devtools retargets the click onto whatever sits beneath the popover.
  const closeAfterClick = () => setTimeout(() => setOpen(false), 0);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Feedback"
        title="Feedback"
        className={`inline-flex items-center justify-center ${triggerClassName}`}
      >
        <IconFeedback className={iconClass} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Feedback options"
          className={`absolute ${alignClass} ${directionClass} z-40 w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg text-sm overflow-hidden`}
        >
          <div className="px-3 pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Feedback</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Report a bug or share an idea</div>
          </div>
          <a
            href={GITHUB_ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={closeAfterClick}
            className="flex items-center gap-2 px-3 py-2 mt-1 touch-manipulation text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400"
          >
            <IconGithub className="w-4 h-4 shrink-0" />
            <div className="flex flex-col">
              <span>GitHub Issues</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Needs a GitHub account</span>
            </div>
          </a>
          <a
            href={buildMailto()}
            role="menuitem"
            onClick={closeAfterClick}
            className="flex items-center gap-2 px-3 py-2 mb-1 touch-manipulation text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400"
          >
            <IconMail className="w-4 h-4 shrink-0" />
            <div className="flex flex-col">
              <span>Email</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">No account needed</span>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
