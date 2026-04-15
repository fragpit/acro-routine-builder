import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './components/App';
import './index.css';

// iOS Safari/PWA returns inconsistent values for vh/dvh on initial render
// (especially in apple-mobile-web-app-capable standalone mode), leaving empty
// space below the layout. Pin the app viewport to visualViewport.height (falls
// back to window.innerHeight) via a CSS custom property, refreshed on resize,
// orientationchange, and pageshow (bfcache restore).
function syncAppHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--app-h', `${h}px`);
}
syncAppHeight();
window.addEventListener('resize', syncAppHeight);
window.addEventListener('orientationchange', syncAppHeight);
window.addEventListener('pageshow', syncAppHeight);
window.visualViewport?.addEventListener('resize', syncAppHeight);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
