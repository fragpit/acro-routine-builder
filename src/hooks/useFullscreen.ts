import { useCallback, useEffect, useState } from 'react';

function fullscreenAvailable(): boolean {
  return document.fullscreenEnabled
    && typeof document.documentElement.requestFullscreen === 'function';
}

function standaloneDisplay(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches
    || iosNavigator.standalone === true;
}

/** Tracks and toggles document fullscreen when the browser exposes the API. */
export function useFullscreen() {
  const [isStandalone] = useState(standaloneDisplay);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.fullscreenElement !== null;
  });

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFullscreen = useCallback(async (): Promise<boolean> => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return true;
    }
    if (!fullscreenAvailable()) return false;
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isFullscreen, isStandalone, toggleFullscreen };
}
