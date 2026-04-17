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
