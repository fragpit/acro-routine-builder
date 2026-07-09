import { Link } from 'react-router-dom';
import FeedbackMenu from '../FeedbackMenu';
import HelpMenu from '../HelpMenu';
import ThemeToggle from '../ThemeToggle';

interface Props {
  onNavigate?: () => void;
  primary: 'builder' | 'home';
  textStyle?: 'framed' | 'plain';
}

const navButtonClassName = 'flex-1 min-w-0 h-9 px-1 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400';
const plainTextLinkClassName = 'shrink-0 h-9 px-1 inline-flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400';

export default function MobileNavLinks({
  onNavigate,
  primary,
  textStyle = 'framed',
}: Props) {
  const textLinkClassName = textStyle === 'plain'
    ? plainTextLinkClassName
    : navButtonClassName;
  const rootClassName = textStyle === 'plain'
    ? 'flex w-full items-center gap-1.5 min-w-0'
    : 'flex items-center gap-1.5 min-w-0';
  const iconWrapperClassName = textStyle === 'plain'
    ? 'shrink-0'
    : 'flex-1 min-w-0';
  const helpWrapperClassName = textStyle === 'plain'
    ? 'ml-auto shrink-0'
    : iconWrapperClassName;
  const iconButtonClassName = textStyle === 'plain'
    ? 'w-10 h-9'
    : 'w-full h-9';
  const themeButtonClassName = textStyle === 'plain'
    ? 'w-10 h-9'
    : 'w-9 h-9';

  return (
    <div className={rootClassName}>
      {primary === 'builder' ? (
        <Link
          to="/builder"
          onClick={onNavigate}
          title="Builder"
          className={textLinkClassName}
        >
          Builder
        </Link>
      ) : (
        <Link
          to="/"
          onClick={onNavigate}
          title="Home"
          aria-label="Home"
          className={navButtonClassName}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10h14V10" />
          </svg>
        </Link>
      )}
      <Link
        to="/docs/rules"
        onClick={onNavigate}
        title="Rules"
        className={textLinkClassName}
      >
        Rules
      </Link>
      <Link
        to="/docs/tricks"
        onClick={onNavigate}
        title="Tricks"
        className={textLinkClassName}
      >
        Tricks
      </Link>
      <div className={helpWrapperClassName}>
        <HelpMenu
          onNavigate={onNavigate}
          triggerClassName={`${iconButtonClassName} rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400`}
          iconSize="sm"
          align="right"
          direction="down"
        />
      </div>
      <div className={iconWrapperClassName}>
        <FeedbackMenu
          triggerClassName={`${iconButtonClassName} inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400`}
          iconSize="sm"
          align="right"
          direction="down"
        />
      </div>
      <div className="shrink-0 flex h-9 justify-center">
        <ThemeToggle className={`${themeButtonClassName} flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition`} />
      </div>
    </div>
  );
}
