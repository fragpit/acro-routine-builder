import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppUpdateController } from '../hooks/useAppUpdateController';
import { useNewsUnread } from '../hooks/useNewsUnread';
import { IconHelp, IconNote, IconRefresh } from './icons';

interface Props {
  triggerClassName?: string;
  iconSize?: 'sm' | 'md';
  align?: 'right' | 'left';
  direction?: 'down' | 'up';
  onNavigate?: () => void;
}

export default function HelpMenu({
  triggerClassName = '',
  iconSize = 'md',
  align = 'right',
  direction = 'down',
  onNavigate,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasUnreadNews = useNewsUnread();
  const { status, latestVersion, applyUpdate } = useAppUpdateController();
  const updateAvailable = status === 'update-available';
  const hasIndicator = hasUnreadNews || updateAvailable;
  const iconClass = iconSize === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  const alignClass = align === 'right' ? 'right-0' : 'left-0';
  const directionClass = direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1';
  const ariaLabel = updateAvailable
    ? 'Help and news, update available'
    : hasUnreadNews
      ? 'Help and news, new updates'
      : 'Help and news';
  const title = updateAvailable
    ? 'Help and news: update available'
    : hasUnreadNews
      ? 'Help and news: new updates'
      : 'Help and news';

  const closeAfterClick = () => {
    onNavigate?.();
    setTimeout(() => setOpen(false), 0);
  };

  const updateApp = () => {
    setOpen(false);
    void applyUpdate();
  };

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
        aria-label={ariaLabel}
        title={title}
        className={`relative inline-flex items-center justify-center ${triggerClassName}`}
      >
        <IconHelp className={iconClass} />
        {hasIndicator && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white dark:ring-slate-900"
          />
        )}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Help options"
          className={`absolute ${alignClass} ${directionClass} z-40 w-48 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg text-sm overflow-hidden`}
        >
          {updateAvailable && (
            <button
              type="button"
              role="menuitem"
              onClick={updateApp}
              className="relative flex w-full items-center gap-2 px-3 py-2 pr-8 mt-1 touch-manipulation text-left text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40"
            >
              <IconRefresh className="w-4 h-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                Update Available
                {latestVersion ? ` v${latestVersion}` : ''}
              </span>
              <span
                aria-hidden="true"
                className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-sky-500"
              />
            </button>
          )}
          <Link
            to="/docs/help"
            role="menuitem"
            onClick={closeAfterClick}
            className={`flex items-center gap-2 px-3 py-2 touch-manipulation text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 ${updateAvailable ? '' : 'mt-1'}`}
          >
            <IconHelp className="w-4 h-4 shrink-0" />
            <span>Help</span>
          </Link>
          <Link
            to="/docs/news"
            role="menuitem"
            onClick={closeAfterClick}
            className="relative flex items-center gap-2 px-3 py-2 pr-8 mb-1 touch-manipulation text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400"
          >
            <IconNote className="w-4 h-4 shrink-0" />
            <span>News</span>
            {hasUnreadNews && (
              <span
                aria-hidden="true"
                className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-sky-500"
              />
            )}
          </Link>
        </div>
      )}
    </div>
  );
}
