import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SCRIPT_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

let cachedBasePath: string | null = null;

function getBasePath(): string {
  if (cachedBasePath !== null) return cachedBasePath;
  cachedBasePath = window.location.pathname.replace(/\/+$/, '');
  return cachedBasePath;
}

function injectBeacon(token: string): void {
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = SCRIPT_SRC;
  script.dataset.cfBeacon = JSON.stringify({
    token,
    spa: true,
    siteTag: `v${__APP_VERSION__}`,
  });
  document.head.appendChild(script);
}

/**
 * Cloudflare Web Analytics integration.
 *
 * Injects the beacon script when a build-time token is present, and
 * mirrors HashRouter navigation onto the History API so the beacon's
 * SPA mode logs route-level pageviews. The hash itself is invisible
 * to CF (cookieless analytics strip the fragment), so the shim
 * writes the virtual route into pathname via replaceState - keeping
 * the back-button stack clean (no extra entries) and producing
 * distinct URLs per route in CF's URL view. Refreshes on virtual
 * paths land on `public/404.html`, which transforms the path back
 * into a hash and redirects to the SPA.
 *
 * No-op when __CF_ANALYTICS_TOKEN__ is null (dev and PR builds).
 */
export function useCloudflareAnalytics(): void {
  const location = useLocation();

  useEffect(() => {
    if (!__CF_ANALYTICS_TOKEN__) return;
    injectBeacon(__CF_ANALYTICS_TOKEN__);
  }, []);

  useEffect(() => {
    if (!__CF_ANALYTICS_TOKEN__) return;
    const target =
      getBasePath() + location.pathname + location.search;
    const current = window.location.pathname + window.location.search;
    if (current === target) return;
    window.history.replaceState(null, '', target);
  }, [location.pathname, location.search]);
}
