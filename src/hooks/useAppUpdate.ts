import { useCallback, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { checkAppVersion } from './app-update-version';

const INSTALL_TIMEOUT_MS = 10000;

/**
 * Status surfaced by the app-update indicator.
 *
 * - `idle` - default; no UI shown unless a pull gesture is in progress.
 * - `checking` - deployed version check in flight.
 * - `update-available` - a newer build was found; waits for user consent.
 * - `updating` - new SW found; activating it and reloading.
 * - `up-to-date` - check finished, no newer build; shown briefly.
 * - `offline` - check failed (e.g. no network); shown briefly.
 */
export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'update-available'
  | 'updating'
  | 'up-to-date'
  | 'offline';

/**
 * Wraps `vite-plugin-pwa`'s `useRegisterSW` and exposes a single
 * update prompt controller. The plugin is configured with `registerType:
 * 'prompt'`, so a waiting SW never auto-activates - the app must explicitly
 * call `updateServiceWorker(true)` after the user chooses to update.
 */
export function useAppUpdate() {
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const statusTimeoutRef = useRef<number | undefined>(undefined);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? undefined;
    },
  });

  const clearStatusTimeout = useCallback(() => {
    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = undefined;
    }
  }, []);

  const flashStatus = useCallback((next: UpdateStatus, ms = 1500) => {
    clearStatusTimeout();
    setLatestVersion(null);
    setStatus(next);
    statusTimeoutRef.current = window.setTimeout(() => {
      setStatus('idle');
      statusTimeoutRef.current = undefined;
    }, ms);
  }, [clearStatusTimeout]);

  const showUpdateAvailable = useCallback((version: string | null = null) => {
    clearStatusTimeout();
    setLatestVersion(version);
    setStatus('update-available');
  }, [clearStatusTimeout]);

  useEffect(() => {
    if (!needRefresh) return;
    const timeout = window.setTimeout(() => showUpdateAvailable(), 0);
    return () => window.clearTimeout(timeout);
  }, [needRefresh, showUpdateAvailable]);

  const checkForUpdate = useCallback(async (silent = false) => {
    clearStatusTimeout();

    if (needRefresh) {
      showUpdateAvailable();
      return true;
    }

    if (!silent) setStatus('checking');

    const result = await checkAppVersion({
      baseUrl: import.meta.env.BASE_URL,
      currentVersion: __APP_VERSION__,
      fetcher: window.fetch.bind(window),
    });

    if (result.status === 'update-available') {
      showUpdateAvailable(result.version);
      return true;
    }

    if (!silent) {
      flashStatus(result.status === 'offline' ? 'offline' : 'up-to-date');
    }

    return false;
  }, [clearStatusTimeout, flashStatus, needRefresh, showUpdateAvailable]);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const startupCheck = window.setTimeout(() => void checkForUpdate(true), 0);

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') void checkForUpdate(true);
    }

    function onOnline() {
      void checkForUpdate(true);
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      window.clearTimeout(startupCheck);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }, [checkForUpdate]);

  const applyUpdate = useCallback(async () => {
    clearStatusTimeout();
    setStatus('updating');

    const registration = registrationRef.current;
    try {
      if (registration && !registration.waiting) {
        await registration.update();
      }

      const readyToActivate = registration
        ? await waitForInstalledWorker(registration)
        : false;

      if (registration && readyToActivate) {
        void updateServiceWorker(true);
        return;
      }
    } catch {
      flashStatus('offline');
      return;
    }

    window.location.reload();
  }, [clearStatusTimeout, flashStatus, updateServiceWorker]);

  const dismissUpdate = useCallback(() => {
    clearStatusTimeout();
    setLatestVersion(null);
    setStatus('idle');
  }, [clearStatusTimeout]);

  return {
    status,
    latestVersion,
    checkForUpdate,
    applyUpdate,
    dismissUpdate,
  };
}

function waitForInstalledWorker(
  registration: ServiceWorkerRegistration,
): Promise<boolean> {
  if (registration.waiting) return Promise.resolve(true);

  const worker = registration.installing;
  if (!worker) return Promise.resolve(false);
  const installingWorker = worker;
  if (
    installingWorker.state === 'installed' ||
    installingWorker.state === 'activated'
  ) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(false);
    }, INSTALL_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeout);
      installingWorker.removeEventListener('statechange', onStateChange);
    }

    function onStateChange() {
      if (
        installingWorker.state === 'installed' ||
        installingWorker.state === 'activated'
      ) {
        cleanup();
        resolve(true);
      }
      if (installingWorker.state === 'redundant') {
        cleanup();
        resolve(false);
      }
    }

    installingWorker.addEventListener('statechange', onStateChange);
  });
}
