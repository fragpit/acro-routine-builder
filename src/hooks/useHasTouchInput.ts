import { useEffect, useState } from 'react';

/** Returns whether the available input capabilities include touch. */
export function detectTouchInput(maxTouchPoints: number, hasCoarsePointer: boolean): boolean {
  return maxTouchPoints > 0 || hasCoarsePointer;
}

function readTouchInput(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return detectTouchInput(
    navigator.maxTouchPoints,
    window.matchMedia('(any-pointer: coarse)').matches,
  );
}

/** Tracks whether the browser exposes touch input, including hybrid devices. */
export function useHasTouchInput(): boolean {
  const [hasTouchInput, setHasTouchInput] = useState(readTouchInput);

  useEffect(() => {
    const mql = window.matchMedia('(any-pointer: coarse)');
    const sync = () => setHasTouchInput(readTouchInput());
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  return hasTouchInput;
}
