import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './components/App';
import './index.css';

// iOS Safari/PWA returns inconsistent values for vh/dvh on initial render
// (especially in apple-mobile-web-app-capable standalone mode), leaving empty
// space below the layout. Pin the app viewport to window.innerHeight via a
// CSS custom property and refresh it on resize/orientation change.
function syncAppHeight() {
  document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`);
}
syncAppHeight();
window.addEventListener('resize', syncAppHeight);
window.addEventListener('orientationchange', syncAppHeight);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
