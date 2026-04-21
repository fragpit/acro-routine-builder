const SVG_PROPS = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Counter-clockwise rotate arrow, used for Undo. */
export function IconUndo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

/** Clockwise rotate arrow, used for Redo. */
export function IconRedo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

/** Three-bar hamburger, used to open side drawer menus. */
export function IconMenu({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

/** Chain-link icon, used to copy anchor links to sections/tricks. */
export function IconLink({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

/** Speech bubble with three dots, used as the Feedback button trigger. */
export function IconFeedback({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
    </svg>
  );
}

/** Envelope icon, used for the email feedback option. */
export function IconMail({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

/** Circle with question mark, used for the user guide / help link. */
export function IconHelp({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/** GitHub logo, used for the GitHub Issues feedback option. */
export function IconGithub({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.67 5.57.67 11.85c0 5.02 3.24 9.27 7.74 10.77.57.11.78-.25.78-.55 0-.27-.01-.99-.02-1.95-3.15.69-3.81-1.52-3.81-1.52-.52-1.31-1.26-1.66-1.26-1.66-1.03-.71.08-.69.08-.69 1.14.08 1.74 1.18 1.74 1.18 1.01 1.74 2.66 1.24 3.31.95.1-.74.4-1.24.72-1.53-2.51-.29-5.15-1.26-5.15-5.6 0-1.24.44-2.25 1.17-3.05-.12-.29-.51-1.44.11-3 0 0 .96-.31 3.14 1.16.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.47 3.14-1.16 3.14-1.16.62 1.56.23 2.71.11 3 .73.8 1.17 1.81 1.17 3.05 0 4.35-2.65 5.31-5.17 5.59.41.35.77 1.04.77 2.1 0 1.52-.01 2.75-.01 3.12 0 .3.21.67.79.55 4.49-1.5 7.73-5.75 7.73-10.77C23.33 5.57 18.27.5 12 .5z" />
    </svg>
  );
}
