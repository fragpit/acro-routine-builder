import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SCRIPT_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

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
 * SPA mode logs route-level pageviews (it only listens to pushState /
 * replaceState - hash changes are invisible to it). The pushState is
 * immediately reverted via replaceState so the address bar and
 * HashRouter state remain unchanged.
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
    const virtualPath = location.pathname + location.search;
    if (window.location.pathname === virtualPath) return;
    const realUrl =
      window.location.pathname +
      window.location.search +
      window.location.hash;
    window.history.pushState(null, '', virtualPath);
    window.history.replaceState(null, '', realUrl);
  }, [location.pathname, location.search]);
}
