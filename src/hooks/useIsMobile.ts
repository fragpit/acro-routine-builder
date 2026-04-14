import { useEffect, useState } from 'react';

/**
 * Returns true when the viewport is narrower than the given breakpoint.
 * Defaults to 1024px (Tailwind's `lg`). Reacts to resize / orientation changes.
 */
export function useIsMobile(breakpointPx = 1024): boolean {
  const query = `(max-width: ${breakpointPx - 1}px)`;
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return isMobile;
}
